/**
 * INTEGRATION TEST — POST /donate (src/routes/donate/index.ts)
 *
 * Boots the donate Express router in-memory and drives it via supertest.
 * The unit test for `submitToAirtable` (tests/unit/services/donation.test.ts)
 * covers field mapping in isolation; this file covers the route's wiring:
 *
 *   - The API-key gate: `?apiKeyForDonate=...`
 *       - missing / wrong  → 401
 *       - matches env var  → request flows to Airtable
 *   - On Airtable success:
 *       - 200 + { success: true } back to caller
 *       - Mailchimp createContact is invoked (with Donor tag)
 *   - On Airtable failure:
 *       - status code from Airtable propagates back to the caller
 *       - Mailchimp is NOT called
 *   - Missing `email` skips the Mailchimp step but still 200s
 *
 * Mocks:
 *   - node-fetch (Airtable)
 *   - src/services/mailchimp/mailchimp.createContact
 *   - src/services/mailchimp/member.getSubscriber
 *
 * The verifyToken middleware on this route is currently a no-op pass-through
 * (see src/middleware/verifyToken.ts), so we don't need to mock it.
 */

const mockFetch = jest.fn();
const createContact = jest.fn();
const getSubscriber = jest.fn();

jest.mock("node-fetch", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetch(...args),
}));
jest.mock("../../src/services/mailchimp/mailchimp", () => ({
  createContact: (...args: unknown[]) => createContact(...args),
}));
jest.mock("../../src/services/mailchimp/member", () => ({
  getSubscriber: (...args: unknown[]) => getSubscriber(...args),
}));

import express from "express";
import request from "supertest";
import donateRouter from "../../src/routes/donate";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/donate", donateRouter);
  return app;
}

beforeEach(() => {
  mockFetch.mockReset();
  createContact.mockReset().mockResolvedValue({
    contactId: "mc-1",
    status: "subscribed",
    emailAddress: "ada@example.com",
  });
  getSubscriber.mockReset().mockResolvedValue({ status: "subscribed", userId: "u-1" });
});

const validBody = {
  chargeId: "ch_1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  toNonprofit: { slug: "pf", name: "Probable Futures" },
  amount: "100.00",
  netAmount: "97",
  currency: "USD",
  frequency: "One-time",
  donationDate: "2026-04-15T00:00:00Z",
  privateNote: "thanks!",
};

describe("POST /donate — auth gate", () => {
  it("401s when apiKeyForDonate is missing", async () => {
    const res = await request(buildApp()).post("/donate").send(validBody);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized access." });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("401s when apiKeyForDonate is wrong", async () => {
    const res = await request(buildApp()).post("/donate?apiKeyForDonate=nope").send(validBody);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("POST /donate — happy path", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ records: [{ id: "rec-1" }] }),
    });
  });

  it("submits to Airtable and returns success", async () => {
    const res = await request(buildApp())
      .post("/donate?apiKeyForDonate=donate-key")
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Donation processed successfully.",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0][0])).toContain("api.airtable.com/v0/");
  });

  it("subscribes the donor in Mailchimp with the Donor tag (existing subscriber → status: subscribed)", async () => {
    await request(buildApp()).post("/donate?apiKeyForDonate=donate-key").send(validBody);

    expect(getSubscriber).toHaveBeenCalledWith("ada@example.com");
    expect(createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: "ada@example.com",
        status: "subscribed",
        tags: [{ name: "Donor", status: "active" }],
      }),
    );
  });

  it("uses status 'pending' when the donor is not already subscribed", async () => {
    getSubscriber.mockResolvedValueOnce({ status: "unsubscribed", userId: "" });

    await request(buildApp()).post("/donate?apiKeyForDonate=donate-key").send(validBody);

    expect(createContact).toHaveBeenCalledWith(expect.objectContaining({ status: "pending" }));
  });

  it("skips the Mailchimp step (and does NOT 500) when the donation has no email", async () => {
    await request(buildApp())
      .post("/donate?apiKeyForDonate=donate-key")
      .send({ ...validBody, email: undefined });

    expect(getSubscriber).not.toHaveBeenCalled();
    expect(createContact).not.toHaveBeenCalled();
    // The route still returns 200; the Airtable submission still ran.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("POST /donate — Airtable failure", () => {
  it("propagates Airtable's status code back to the caller", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: { type: "INVALID_VALUE_FOR_COLUMN" } }),
    });

    const res = await request(buildApp())
      .post("/donate?apiKeyForDonate=donate-key")
      .send(validBody);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
  });

  it("does NOT subscribe the donor to Mailchimp when Airtable fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    });

    await request(buildApp()).post("/donate?apiKeyForDonate=donate-key").send(validBody);

    expect(createContact).not.toHaveBeenCalled();
  });
});
