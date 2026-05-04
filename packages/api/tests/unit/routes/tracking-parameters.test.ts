/**
 * UNIT TESTS — src/routes/tracking/parameters.ts
 *
 * Sister test to contact-parameters; tracking uses the same AJV pattern but a
 * different schema. Worth its own file because the recent AJV upgrade
 * regression broke validators independently — covering both shields against
 * shared-config drift.
 */
import { validateFormData } from "../../../src/routes/tracking/parameters";
import { ApplicationError } from "../../../src/utils/error";

const validBody = {
  data: {
    helpful: true,
    articleName: "Heat in the Mediterranean",
    articleLink: "https://probablefutures.org/articles/heat-med",
  },
};

describe("tracking validateFormData()", () => {
  it("returns the inner data when the body is valid", async () => {
    await expect(validateFormData(validBody)).resolves.toEqual(validBody.data);
  });

  it("accepts the optional fields", async () => {
    const body = {
      data: {
        ...validBody.data,
        email: "reader@example.com",
        whatWasHelpful: "the maps",
        howToImprove: "more granularity",
        perspectiveCategory: "researcher",
      },
    };
    await expect(validateFormData(body)).resolves.toEqual(body.data);
  });

  it("rejects bodies missing `helpful` (the core required boolean)", async () => {
    const body = {
      data: {
        articleName: "x",
        articleLink: "https://x.test/x",
      },
    };
    await expect(validateFormData(body as any)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects malformed articleLink (must be a URI)", async () => {
    const body = {
      data: { ...validBody.data, articleLink: "not a url" },
    };
    await expect(validateFormData(body)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects malformed email when provided", async () => {
    const body = {
      data: { ...validBody.data, email: "nope" },
    };
    await expect(validateFormData(body)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects unknown properties", async () => {
    const body = {
      data: { ...validBody.data, foo: "bar" },
    };
    await expect(validateFormData(body as any)).rejects.toMatchObject({ status: 400 });
  });

  it("returns one reason per schema violation", async () => {
    let caught: ApplicationError | undefined;
    try {
      await validateFormData({ data: {} } as any);
    } catch (e) {
      caught = e as ApplicationError;
    }
    expect(caught).toBeDefined();
    expect(caught!.reasons.length).toBeGreaterThanOrEqual(3);
  });
});
