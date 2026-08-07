/**
 * INTEGRATION TEST — POST /tracking/perspectives (src/routes/tracking/index.ts)
 *
 * Boots the tracking router in-memory and drives it via supertest. The schema is
 * covered by tests/unit/routes/tracking-parameters.test.ts; this file covers the
 * route's wiring, and specifically the property that keeps duplicate feedback out
 * of #perspectives-feedback: Slack is notified only after Airtable has accepted
 * the write, so a failed write plus the reader's retry cannot post the same
 * feedback twice.
 *
 * isProd is forced on because the Slack notification is production-only.
 */

const mockFetch = jest.fn();
const sendSlackNotification = jest.fn();
const sendErrorToSlack = jest.fn();

jest.mock("node-fetch", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetch(...args),
}));
jest.mock("../../src/services/slack-notfier", () => ({
  sendSlackNotification: (...args: unknown[]) => sendSlackNotification(...args),
}));
jest.mock("../../src/utils/slack", () => ({
  sendErrorToSlack: (...args: unknown[]) => sendErrorToSlack(...args),
}));
jest.mock("../../src/utils/env", () => ({
  ...jest.requireActual("../../src/utils/env"),
  isProd: true,
}));

import express from "express";
import request from "supertest";
import trackingRouter from "../../src/routes/tracking";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/tracking", trackingRouter);
  return app;
}

const post = (body: object) =>
  request(buildApp()).post("/tracking/perspectives?apiKey=tracking-key").send(body);

const airtableAccepts = () =>
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ records: [{ id: "rec-1" }] }),
  });

const airtableRejects = (status = 422) =>
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: { type: "INVALID_MULTIPLE_CHOICE_OPTIONS" } }),
  });

const validBody = {
  data: {
    helpful: true,
    articleName: "Heat in the Mediterranean",
    articleLink: "https://probablefutures.org/articles/heat-med",
    whatWasHelpful: "the maps",
  },
};

beforeEach(() => {
  mockFetch.mockReset();
  sendSlackNotification.mockReset().mockResolvedValue(undefined);
  sendErrorToSlack.mockReset().mockResolvedValue(undefined);
});

describe("POST /tracking/perspectives — auth gate", () => {
  it("401s when the apiKey is wrong, before touching Airtable or Slack", async () => {
    const res = await request(buildApp())
      .post("/tracking/perspectives?apiKey=nope")
      .send(validBody);

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(sendSlackNotification).not.toHaveBeenCalled();
  });
});

describe("POST /tracking/perspectives — Slack ordering", () => {
  it("notifies Slack once Airtable has accepted the write", async () => {
    airtableAccepts();

    const res = await post(validBody);

    expect(res.status).toBe(200);
    expect(sendSlackNotification).toHaveBeenCalledTimes(1);
    expect(sendSlackNotification.mock.calls[0][0]).toContain("Heat in the Mediterranean");
    expect(sendSlackNotification.mock.calls[0][1]).toBe("#perspectives-feedback");
  });

  it("does NOT notify Slack when Airtable rejects the write", async () => {
    airtableRejects();

    const res = await post(validBody);

    expect(res.status).toBe(422);
    expect(sendSlackNotification).not.toHaveBeenCalled();
    // The failure still reaches the separate error channel.
    expect(sendErrorToSlack).toHaveBeenCalledTimes(1);
  });

  it("does NOT notify Slack when the Airtable call throws", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const res = await post(validBody);

    expect(res.status).toBe(500);
    expect(sendSlackNotification).not.toHaveBeenCalled();
  });

  it("still returns 200 when Airtable succeeded but Slack failed", async () => {
    airtableAccepts();
    sendSlackNotification.mockRejectedValue(new Error("webhook down"));

    const res = await post(validBody);

    expect(res.status).toBe(200);
  });
});
