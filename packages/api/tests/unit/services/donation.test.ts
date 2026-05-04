/**
 * UNIT TESTS — src/services/donation/request.ts (submitToAirtable)
 *
 * Mocks node-fetch so we never hit api.airtable.com. Inspects the request
 * payload to assert the field-mapping & data-coercion contract that this
 * function has had repeated bugs in:
 *
 *   - amount string → parseFloat (fails open if junk: NaN)
 *   - donationDate → ISO date (yyyy-mm-dd) split off the T-component
 *   - missing firstName/lastName must not throw on string concat
 *   - missing email/privateNote default to empty strings (not "undefined")
 *   - field IDs come from the env-conditional formFieldsDonation map
 */
const mockFetch = jest.fn();
jest.mock("node-fetch", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetch(...args),
}));

import { submitToAirtable } from "../../../src/services/donation/request";
import { formFieldsDonation } from "../../../src/routes/donate/fields";
import type { EveryOrgObject } from "../../../src/routes/donate";

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
});

const baseDonation: EveryOrgObject = {
  chargeId: "ch_1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  toNonprofit: { slug: "pf", name: "Probable Futures" },
  amount: "42.50",
  netAmount: "40.00",
  currency: "USD",
  frequency: "One-time",
  donationDate: new Date("2026-04-15T13:00:00Z"),
  privateNote: "thanks!",
};

function getSentBody() {
  expect(mockFetch).toHaveBeenCalledTimes(1);
  const [, init] = mockFetch.mock.calls[0];
  return JSON.parse((init as { body: string }).body);
}

describe("submitToAirtable()", () => {
  it("POSTs to the Airtable v0 base/table URL with a Bearer token", async () => {
    await submitToAirtable(baseDonation);

    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toMatch(/^https:\/\/api\.airtable\.com\/v0\/[^/]+\/[^/]+$/);
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: expect.stringMatching(/^Bearer /),
        "Content-Type": "application/json",
      }),
    });
  });

  it("maps each EveryOrg field to the configured Airtable field id", async () => {
    await submitToAirtable(baseDonation);
    const fields = getSentBody().records[0].fields;

    expect(fields[formFieldsDonation["Charge ID"]]).toBe("ch_1");
    expect(fields[formFieldsDonation["Full Name"]]).toBe("Ada Lovelace");
    expect(fields[formFieldsDonation["Email"]]).toBe("ada@example.com");
    expect(fields[formFieldsDonation["Total Donated"]]).toBe(42.5);
    expect(fields[formFieldsDonation["Donation Date"]]).toBe("2026-04-15");
    expect(fields[formFieldsDonation["Private Note"]]).toBe("thanks!");
  });

  it("parses amount as a float (regression: amount used to be sent as a string)", async () => {
    await submitToAirtable({ ...baseDonation, amount: "100.00" });
    const fields = getSentBody().records[0].fields;
    expect(fields[formFieldsDonation["Total Donated"]]).toBe(100);
    expect(typeof fields[formFieldsDonation["Total Donated"]]).toBe("number");
  });

  it("trims donationDate to yyyy-mm-dd (no time component)", async () => {
    await submitToAirtable(baseDonation);
    const fields = getSentBody().records[0].fields;
    expect(fields[formFieldsDonation["Donation Date"]]).toBe("2026-04-15");
    expect(fields[formFieldsDonation["Donation Date"]]).not.toMatch(/T/);
  });

  it("handles missing firstName/lastName without producing 'undefined undefined'", async () => {
    await submitToAirtable({ ...baseDonation, firstName: undefined, lastName: undefined });
    const fields = getSentBody().records[0].fields;
    // firstName ?? "" + " " + lastName ?? "" → " " (single space)
    expect(fields[formFieldsDonation["Full Name"]]).toBe(" ");
    expect(fields[formFieldsDonation["Full Name"]]).not.toContain("undefined");
  });

  it("handles a missing email by sending an empty string, not 'undefined'", async () => {
    await submitToAirtable({ ...baseDonation, email: undefined });
    const fields = getSentBody().records[0].fields;
    expect(fields[formFieldsDonation["Email"]]).toBe("");
  });

  it("handles a missing donationDate by sending an empty string", async () => {
    await submitToAirtable({ ...baseDonation, donationDate: undefined as any });
    const fields = getSentBody().records[0].fields;
    expect(fields[formFieldsDonation["Donation Date"]]).toBe("");
  });

  it("handles a missing privateNote by sending an empty string", async () => {
    await submitToAirtable({ ...baseDonation, privateNote: undefined as any });
    const fields = getSentBody().records[0].fields;
    expect(fields[formFieldsDonation["Private Note"]]).toBe("");
  });

  it("returns the underlying fetch Response unchanged", async () => {
    const fakeResponse = { ok: true, status: 200, json: async () => ({}) };
    mockFetch.mockResolvedValueOnce(fakeResponse);
    const out = await submitToAirtable(baseDonation);
    expect(out).toBe(fakeResponse);
  });
});
