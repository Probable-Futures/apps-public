/**
 * INTEGRATION TEST — POST /contact/create (src/routes/contact/index.ts)
 *
 * Boots the contact Express router in-memory and drives it via supertest.
 * `validateFormData` is covered in tests/unit/routes/contact-parameters.test.ts
 * and `createContact` in tests/unit/services/mailchimp.test.ts; this file
 * covers the route's error reporting:
 *
 *   - A body without `data` (a scanner, not a signup form) → 400, no Slack alert
 *   - A form body that fails validation → 400 + Slack alert
 *   - A Mailchimp failure → its status + Slack alert with the email
 *
 * Mocks:
 *   - src/services/mailchimp/mailchimp.createContact
 *   - src/services/mailchimp/member.getSubscriber
 *   - src/utils/slack.sendErrorToSlack
 */

const createContact = jest.fn();
const getSubscriber = jest.fn();
const sendErrorToSlack = jest.fn();

jest.mock("../../src/services/mailchimp/mailchimp", () => ({
  createContact: (...args: unknown[]) => createContact(...args),
}));
jest.mock("../../src/services/mailchimp/member", () => ({
  getSubscriber: (...args: unknown[]) => getSubscriber(...args),
}));
jest.mock("../../src/utils/slack", () => ({
  sendErrorToSlack: (...args: unknown[]) => sendErrorToSlack(...args),
}));

import express from "express";
import request from "supertest";
import contactRouter from "../../src/routes/contact";
import { ApplicationError } from "../../src/utils/error";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/contact", contactRouter);
  return app;
}

const validBody = {
  data: {
    emailAddress: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    includeAnswers: true,
    subscribeToEmails: true,
  },
};

beforeEach(() => {
  createContact.mockReset().mockResolvedValue({
    contactId: "mc-1",
    status: "pending",
    emailAddress: "ada@example.com",
  });
  getSubscriber.mockReset().mockResolvedValue({ status: "pending", userId: "" });
  sendErrorToSlack.mockReset();
});

describe("POST /contact/create — error reporting", () => {
  it("400s a body without `data` and does not alert Slack", async () => {
    const res = await request(buildApp()).post("/contact/create").send({});

    expect(res.status).toBe(400);
    expect(createContact).not.toHaveBeenCalled();
    expect(sendErrorToSlack).not.toHaveBeenCalled();
  });

  it("400s an empty POST to the /contact alias and does not alert Slack", async () => {
    const res = await request(buildApp()).post("/contact");

    expect(res.status).toBe(400);
    expect(sendErrorToSlack).not.toHaveBeenCalled();
  });

  it("alerts Slack when a form body fails validation", async () => {
    const res = await request(buildApp())
      .post("/contact/create")
      .send({ data: { ...validBody.data, emailAddress: "not-an-email" } });

    expect(res.status).toBe(400);
    expect(sendErrorToSlack).toHaveBeenCalledTimes(1);
  });

  it("alerts Slack with the email when Mailchimp fails", async () => {
    createContact.mockRejectedValueOnce(
      new ApplicationError(400, "Member Exists", [], "Member Exists"),
    );

    const res = await request(buildApp()).post("/contact/create").send(validBody);

    expect(res.status).toBe(400);
    expect(sendErrorToSlack).toHaveBeenCalledWith(
      expect.any(String),
      "Create Contact Error",
      "Email: ada@example.com",
    );
  });
});

describe("POST /contact/create — happy path", () => {
  it("201s with the contact and does not alert Slack", async () => {
    const res = await request(buildApp()).post("/contact/create").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      data: { contactId: "mc-1", status: "pending", emailAddress: "ada@example.com" },
    });
    expect(sendErrorToSlack).not.toHaveBeenCalled();
  });
});
