/**
 * UNIT TESTS — src/services/mailchimp/mailchimp.ts (createContact)
 *
 * Mocks `./request.sendRequest` and `./tags.attachTagToMemeber` so we never
 * hit the Mailchimp API. Verifies the three branches:
 *
 *   1. Happy path: PUT member, then attach tags if any, return shaped result.
 *   2. "Member In Compliance State" → retry the PUT with status: "pending".
 *      This is a real bug-fix path (commit 27a3a6d3 — resubscribe error).
 *   3. Other errors → bubble up unchanged (no swallowing).
 *
 * Also asserts:
 *   - the URL uses md5(emailAddress) (Mailchimp's required key shape)
 *   - the body has snake_cased keys (mapKeys + snakeCase contract)
 *   - `tags` key is omitted from the member PUT body (it goes in a separate call)
 */
const sendRequest = jest.fn();
const attachTagToMemeber = jest.fn();

jest.mock("../../../src/services/mailchimp/request", () => ({
  sendRequest: (...args: unknown[]) => sendRequest(...args),
}));
jest.mock("../../../src/services/mailchimp/tags", () => ({
  attachTagToMemeber: (...args: unknown[]) => attachTagToMemeber(...args),
}));

import { Response } from "node-fetch";
import md5 from "md5";

import { createContact } from "../../../src/services/mailchimp/mailchimp";
import { ApplicationError } from "../../../src/utils/error";

function makeFetchResponse(body: object) {
  // node-fetch Response with a real body so .json() works; createContact uses
  // `response instanceof Response` so we must give it the genuine class.
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
  attachTagToMemeber.mockReset();
});

const newContact = {
  emailAddress: "ada@example.com",
  status: "subscribed" as const,
  mergeFields: { FNAME: "Ada", LNAME: "Lovelace" },
};

describe("createContact() — happy path", () => {
  beforeEach(() => {
    sendRequest.mockResolvedValue(
      makeFetchResponse({ id: "id-1", status: "subscribed", email_address: "ada@example.com" }),
    );
  });

  it("PUTs to /lists/{listId}/members/{md5(email)}", async () => {
    await createContact(newContact);
    const [path, opts] = sendRequest.mock.calls[0];
    expect(path).toContain(`/members/${md5("ada@example.com")}`);
    expect(opts).toMatchObject({ method: "PUT" });
  });

  it("snake-cases keys in the request body and omits `tags` from the member PUT", async () => {
    await createContact({ ...newContact, tags: [{ name: "Donor", status: "active" }] });

    const [, opts] = sendRequest.mock.calls[0];
    const body = JSON.parse((opts as { body: string }).body);
    expect(body).toMatchObject({
      email_address: "ada@example.com",
      status: "subscribed",
      merge_fields: { FNAME: "Ada", LNAME: "Lovelace" },
    });
    expect(body).not.toHaveProperty("tags");
  });

  it("attaches tags via the separate tags endpoint when provided", async () => {
    const tags = [{ name: "Donor", status: "active" }];
    await createContact({ ...newContact, tags });

    expect(attachTagToMemeber).toHaveBeenCalledWith("ada@example.com", { tags });
  });

  it("does NOT call attachTagToMemeber when no tags are provided", async () => {
    await createContact(newContact);
    expect(attachTagToMemeber).not.toHaveBeenCalled();
  });

  it("does NOT call attachTagToMemeber when an empty tags array is provided", async () => {
    await createContact({ ...newContact, tags: [] });
    expect(attachTagToMemeber).not.toHaveBeenCalled();
  });

  it("returns the shaped { contactId, status, emailAddress } result", async () => {
    const result = await createContact(newContact);
    expect(result).toEqual({
      contactId: "id-1",
      status: "subscribed",
      emailAddress: "ada@example.com",
    });
  });
});

describe("createContact() — Member In Compliance State retry", () => {
  // This is the documented-bug path: when Mailchimp says the member is in
  // compliance state (e.g. previously unsubscribed), we retry as "pending"
  // to re-trigger the double-opt-in flow rather than 500ing.
  it("retries with status: 'pending' when sendRequest throws a compliance error", async () => {
    const compliance = new ApplicationError(400, "compliance", [], "Member In Compliance State");
    sendRequest
      .mockRejectedValueOnce(compliance)
      .mockResolvedValueOnce(
        makeFetchResponse({ id: "id-2", status: "pending", email_address: "ada@example.com" }),
      );

    const result = await createContact(newContact);

    expect(sendRequest).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(sendRequest.mock.calls[1][1].body);
    expect(retryBody.status).toBe("pending");
    expect(result).toEqual({
      contactId: "id-2",
      status: "pending",
      emailAddress: "ada@example.com",
    });
  });

  it("does NOT call attachTagToMemeber on the compliance retry path", async () => {
    // The first PUT throws → tag attachment is skipped. Then we retry with
    // pending and return. We don't currently re-attempt tag attachment
    // (existing behavior). This test pins that contract — flip it if the
    // code intentionally changes.
    const compliance = new ApplicationError(400, "compliance", [], "Member In Compliance State");
    sendRequest
      .mockRejectedValueOnce(compliance)
      .mockResolvedValueOnce(
        makeFetchResponse({ id: "id-2", status: "pending", email_address: "ada@example.com" }),
      );

    await createContact({ ...newContact, tags: [{ name: "Donor", status: "active" }] });

    expect(attachTagToMemeber).not.toHaveBeenCalled();
  });
});

describe("createContact() — error passthrough", () => {
  it("re-throws non-compliance errors from sendRequest", async () => {
    sendRequest.mockRejectedValue(new ApplicationError(500, "boom", [], "Internal Server Error"));
    await expect(createContact(newContact)).rejects.toMatchObject({
      message: "boom",
      name: "Internal Server Error",
    });
  });
});
