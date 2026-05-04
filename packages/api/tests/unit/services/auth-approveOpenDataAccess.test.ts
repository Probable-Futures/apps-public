/**
 * UNIT TESTS — src/services/auth/approveOpenDataAccess.ts
 *
 * This file orchestrates a chain of side-effects: DB → Auth0 → SES → DB →
 * Mailchimp → Slack. We cover the highest-value branches without spinning
 * up any of those services:
 *
 *   - input validation (formName, email, formFields) → throws
 *   - DB error on create_user_access_request → Slack + rethrow
 *   - DB returns no requestId → Slack + throw
 *   - whatWouldYouLikeToUse: "pfApi" → calls createClient, returns clientId
 *   - whatWouldYouLikeToUse: "pfPro" or "pfRawData" → calls grantPfProAccess
 *   - whatWouldYouLikeToUse contains both pfPro AND pfRawData → grantPfProAccess
 *     called only ONCE (the `grantedAccessToPro` guard — recently fixed)
 *   - sendAccessEmail failure → does NOT throw; reports to Slack and continues
 *   - emailList === "Yes, please sign me up." → calls Mailchimp createContact
 *   - emailList?.name === "Yes, please sign me up." → also subscribes (object form)
 *
 * Every external module is mocked. No real I/O.
 */

const verify = jest.fn();
const createClient = jest.fn();
const grantPfProAccess = jest.fn();
const sendAccessEmail = jest.fn();
const composeEmail = jest.fn();
const getSubscriber = jest.fn();
const createContact = jest.fn();
const sendErrorToSlack = jest.fn();
const loggerStub = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

jest.mock("../../../src/services/auth/token", () => ({
  verify: (...a: unknown[]) => verify(...a),
}));
jest.mock("../../../src/services/auth/client", () => ({
  __esModule: true,
  default: (...a: unknown[]) => createClient(...a),
}));
jest.mock("../../../src/services/auth/grantPfProAccess", () => ({
  __esModule: true,
  default: (...a: unknown[]) => grantPfProAccess(...a),
}));
jest.mock("../../../src/services/auth/sendAccessEmail", () => ({
  __esModule: true,
  default: (...a: unknown[]) => sendAccessEmail(...a),
  composeEmail: (...a: unknown[]) => composeEmail(...a),
}));
jest.mock("../../../src/services/mailchimp/member", () => ({
  getSubscriber: (...a: unknown[]) => getSubscriber(...a),
}));
jest.mock("../../../src/services/mailchimp/mailchimp", () => ({
  createContact: (...a: unknown[]) => createContact(...a),
}));
jest.mock("../../../src/utils", () => {
  const real = jest.requireActual("../../../src/utils");
  return {
    ...real,
    logger: loggerStub,
    slackUtils: { sendErrorToSlack: (...a: unknown[]) => sendErrorToSlack(...a) },
  };
});

import approveOpenDataAccess from "../../../src/services/auth/approveOpenDataAccess";
import { formFieldsNameIdMap } from "../../../src/utils/form";

beforeEach(() => {
  verify.mockReset().mockResolvedValue({ access_token: "auth0-mgmt-token" });
  createClient.mockReset();
  grantPfProAccess.mockReset();
  sendAccessEmail.mockReset().mockResolvedValue(undefined);
  composeEmail.mockReset().mockReturnValue("<email body>");
  getSubscriber.mockReset().mockResolvedValue({ status: "pending", userId: "" });
  createContact.mockReset().mockResolvedValue({
    contactId: "mc-1",
    status: "pending",
    emailAddress: "ada@example.com",
  });
  sendErrorToSlack.mockReset().mockResolvedValue(undefined);
});

function makeContext(rows: any[] = [{ create_user_access_request: 999 }]) {
  return {
    pgClient: {
      query: jest.fn().mockResolvedValue({ rows }),
    },
  };
}

function field(id: string, value: any) {
  return [id, { name: id, value }];
}

function makeFormFields(opts: {
  whatWouldYouLikeToUse?: { id: string; name?: string }[];
  firstName?: string;
  lastName?: string;
  emailList?: string | { name: string };
}) {
  return Object.fromEntries(
    [
      field(formFieldsNameIdMap["whatWouldYouLikeToUse"], opts.whatWouldYouLikeToUse ?? []),
      field(formFieldsNameIdMap["firstName"], opts.firstName ?? "Ada"),
      field(formFieldsNameIdMap["lastName"], opts.lastName ?? "Lovelace"),
      field(formFieldsNameIdMap["emailList"], opts.emailList ?? "No, thanks."),
    ].filter(Boolean) as any,
  );
}

describe("approveOpenDataAccess — input validation", () => {
  it("throws when formName is missing", async () => {
    await expect(
      approveOpenDataAccess({}, { input: { email: "x@y.z", formFields: {} } }, makeContext()),
    ).rejects.toThrow("formName is missing.");
  });

  it("throws when email is missing", async () => {
    await expect(
      approveOpenDataAccess({}, { input: { formName: "f", formFields: {} } }, makeContext()),
    ).rejects.toThrow("email is missing.");
  });

  it("throws when formFields is missing", async () => {
    await expect(
      approveOpenDataAccess({}, { input: { formName: "f", email: "x@y.z" } }, makeContext()),
    ).rejects.toThrow("formFields is missing.");
  });
});

describe("approveOpenDataAccess — DB failures", () => {
  it("reports to Slack and rethrows when create_user_access_request errors out", async () => {
    const ctx = {
      pgClient: { query: jest.fn().mockRejectedValueOnce(new Error("pg dead")) },
    };
    await expect(
      approveOpenDataAccess(
        {},
        { input: { formName: "f", email: "x@y.z", formFields: makeFormFields({}) } },
        ctx,
      ),
    ).rejects.toThrow("pg dead");
    expect(sendErrorToSlack).toHaveBeenCalledWith(
      "pg dead",
      "Approve Open Data Request Error",
      expect.stringContaining("Email: x@y.z"),
    );
  });

  it("throws when create_user_access_request returns no requestId", async () => {
    await expect(
      approveOpenDataAccess(
        {},
        { input: { formName: "f", email: "x@y.z", formFields: makeFormFields({}) } },
        makeContext([{ create_user_access_request: undefined }]),
      ),
    ).rejects.toThrow("create_user_access_request returned no request ID");
  });
});

describe("approveOpenDataAccess — Auth0 client (pfApi)", () => {
  it("creates an Auth0 client when pfApi is selected and returns its client_id", async () => {
    createClient.mockResolvedValue({
      client: {
        statusCode: 201,
        client_id: "auth0-client-1",
        client_secret: "shh",
      },
    });

    const result = await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "x@y.z",
          formFields: makeFormFields({
            whatWouldYouLikeToUse: [{ id: formFieldsNameIdMap["pfApi"] }],
          }),
        },
      },
      makeContext(),
    );

    expect(createClient).toHaveBeenCalledWith("Ada Lovelace", "auth0-mgmt-token");
    expect(result.clientId).toBe("auth0-client-1");
  });

  it("collects an error message when createClient returns an error status", async () => {
    createClient.mockResolvedValue({
      client: {
        statusCode: 500,
        error: true,
        message: "auth0 down",
      },
    });

    const result = await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "x@y.z",
          formFields: makeFormFields({
            whatWouldYouLikeToUse: [{ id: formFieldsNameIdMap["pfApi"] }],
          }),
        },
      },
      makeContext(),
    );

    expect(result.clientId).toBeUndefined();
    expect(result.error).toContain("auth0 down");
    // Error gets aggregated and sent to Slack at the end of the success branch.
    expect(sendErrorToSlack).toHaveBeenCalledWith(
      expect.stringContaining("auth0 down"),
      expect.any(String),
      expect.any(String),
    );
  });
});

describe("approveOpenDataAccess — Pro access (pfPro / pfRawData)", () => {
  beforeEach(() => {
    grantPfProAccess.mockResolvedValue({
      user: { statusCode: 200, user_id: "pro-user-1" },
      alreadyExists: false,
    });
  });

  it("grants Pro access when pfPro is selected", async () => {
    const result = await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "x@y.z",
          formFields: makeFormFields({
            whatWouldYouLikeToUse: [{ id: formFieldsNameIdMap["pfPro"] }],
          }),
        },
      },
      makeContext(),
    );

    expect(grantPfProAccess).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe("pro-user-1");
    expect(result.userAlreadyExists).toBe(false);
  });

  it("only calls grantPfProAccess ONCE when both pfPro AND pfRawData are selected (regression guard)", async () => {
    await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "x@y.z",
          formFields: makeFormFields({
            whatWouldYouLikeToUse: [
              { id: formFieldsNameIdMap["pfPro"] },
              { id: formFieldsNameIdMap["pfRawData"] },
            ],
          }),
        },
      },
      makeContext(),
    );
    expect(grantPfProAccess).toHaveBeenCalledTimes(1);
  });
});

describe("approveOpenDataAccess — email send failure does NOT abort the flow", () => {
  it("Slack-reports the email error and still updates the DB", async () => {
    sendAccessEmail.mockRejectedValueOnce(new Error("ses down"));
    const ctx = makeContext();

    const result = await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "x@y.z",
          formFields: makeFormFields({}),
        },
      },
      ctx,
    );

    // Two queries: the create_user_access_request, then the
    // pf_update_user_access_request. The update must run even after email fails.
    expect(ctx.pgClient.query).toHaveBeenCalledTimes(2);
    expect(ctx.pgClient.query.mock.calls[1][0]).toContain("pf_update_user_access_request");

    // The error must surface in the response.error string.
    expect(result.error).toContain("ses down");

    // And it must be flagged to Slack.
    expect(sendErrorToSlack).toHaveBeenCalledWith(
      expect.stringContaining("ses down"),
      expect.any(String),
      expect.any(String),
    );
  });
});

describe("approveOpenDataAccess — Mailchimp subscription", () => {
  it('subscribes the user to Mailchimp when emailList === "Yes, please sign me up."', async () => {
    await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "ada@example.com",
          formFields: makeFormFields({
            emailList: "Yes, please sign me up.",
          }),
        },
      },
      makeContext(),
    );

    expect(getSubscriber).toHaveBeenCalledWith("ada@example.com");
    expect(createContact).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: "ada@example.com", status: "pending" }),
    );
  });

  it("subscribes when emailList is the OBJECT form { name: 'Yes, please sign me up.' }", async () => {
    // This branch was added to handle multi-select Airtable fields that
    // arrive as { id, name } rather than as a plain string.
    await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "ada@example.com",
          formFields: makeFormFields({
            emailList: { name: "Yes, please sign me up." },
          }),
        },
      },
      makeContext(),
    );

    expect(createContact).toHaveBeenCalledTimes(1);
  });

  it('uses status: "subscribed" when the user is already subscribed in Mailchimp', async () => {
    getSubscriber.mockResolvedValueOnce({ status: "subscribed", userId: "u-1" });

    await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "ada@example.com",
          formFields: makeFormFields({
            emailList: "Yes, please sign me up.",
          }),
        },
      },
      makeContext(),
    );

    expect(createContact).toHaveBeenCalledWith(expect.objectContaining({ status: "subscribed" }));
  });

  it("does NOT call createContact when the user opted out of the email list", async () => {
    await approveOpenDataAccess(
      {},
      {
        input: {
          formName: "f",
          email: "ada@example.com",
          formFields: makeFormFields({ emailList: "No thanks." }),
        },
      },
      makeContext(),
    );

    expect(createContact).not.toHaveBeenCalled();
  });

  it("does NOT throw when Mailchimp createContact fails — just reports to Slack", async () => {
    createContact.mockRejectedValueOnce(new Error("mailchimp down"));

    await expect(
      approveOpenDataAccess(
        {},
        {
          input: {
            formName: "f",
            email: "ada@example.com",
            formFields: makeFormFields({
              emailList: "Yes, please sign me up.",
            }),
          },
        },
        makeContext(),
      ),
    ).resolves.toBeDefined();

    expect(sendErrorToSlack).toHaveBeenCalledWith(
      "mailchimp down",
      expect.any(String),
      expect.any(String),
    );
  });
});
