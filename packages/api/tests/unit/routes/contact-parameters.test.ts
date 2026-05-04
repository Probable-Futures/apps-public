/**
 * UNIT TESTS — src/routes/contact/parameters.ts
 *
 * Pure AJV validation. No mocks. Asserts the contract:
 *   - happy path returns the inner `data` payload
 *   - missing required fields throw an ApplicationError(400) with reasons
 *   - bad email format is rejected
 *   - additional properties are rejected (schema is strict)
 *   - tags/interests are optional
 */
import { validateFormData } from "../../../src/routes/contact/parameters";
import { ApplicationError } from "../../../src/utils/error";

const validBody = {
  data: {
    emailAddress: "user@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    includeAnswers: true,
    subscribeToEmails: true,
  },
};

describe("contact validateFormData()", () => {
  it("returns the inner data when the body is valid", async () => {
    await expect(validateFormData(validBody)).resolves.toEqual(validBody.data);
  });

  it("accepts optional tags + interests arrays", async () => {
    const body = {
      data: {
        ...validBody.data,
        tags: ["Donor", "Newsletter"],
        interests: ["int-1", "int-2"],
      },
    };
    await expect(validateFormData(body)).resolves.toEqual(body.data);
  });

  it("rejects bodies that are missing required fields", async () => {
    const body = {
      data: {
        firstName: "Ada",
        lastName: "Lovelace",
        // missing emailAddress, includeAnswers, subscribeToEmails
      },
    };
    await expect(validateFormData(body as any)).rejects.toMatchObject({
      status: 400,
      message: "invalid request body",
    });
  });

  it("annotates each schema violation as a separate reason", async () => {
    const body = {
      data: {
        firstName: "Ada",
        lastName: "Lovelace",
      },
    };
    let caught: ApplicationError | undefined;
    try {
      await validateFormData(body as any);
    } catch (e) {
      caught = e as ApplicationError;
    }
    expect(caught).toBeDefined();
    // Three required fields are missing → at least three reason errors.
    expect(caught!.reasons.length).toBeGreaterThanOrEqual(3);
    expect(caught!.reasons.every((r) => r.message.startsWith("body"))).toBe(true);
  });

  it("rejects malformed email addresses", async () => {
    const body = {
      data: { ...validBody.data, emailAddress: "not-an-email" },
    };
    await expect(validateFormData(body)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects unknown properties (schema sets additionalProperties: false)", async () => {
    const body = {
      data: { ...validBody.data, hacker: "trying to inject" },
    };
    await expect(validateFormData(body as any)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects when the top-level `data` wrapper is missing", async () => {
    await expect(validateFormData({} as any)).rejects.toMatchObject({ status: 400 });
  });
});
