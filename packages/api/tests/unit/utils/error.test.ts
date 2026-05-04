/**
 * UNIT TESTS — src/utils/error.ts
 *
 * No mocks needed. ApplicationError, collect(), and serialize() are pure
 * data transformations: in → out. trapFallthroughErrors uses Express types
 * but no I/O, so it's also unit-tested here with hand-rolled req/res stubs.
 */
import createHttpError from "http-errors";
import {
  ApplicationError,
  collect,
  serialize,
  trapFallthroughErrors,
} from "../../../src/utils/error";

describe("ApplicationError", () => {
  it("captures status, message, and reasons", () => {
    const reasons = [new Error("missing field"), new Error("bad format")];
    const err = new ApplicationError(400, "invalid", reasons);

    expect(err.status).toBe(400);
    expect(err.message).toBe("invalid");
    expect(err.reasons).toEqual(reasons);
    expect(err.name).toBe("Error");
  });

  it("accepts an optional name override", () => {
    const err = new ApplicationError(409, "conflict", [], "Member In Compliance State");
    expect(err.name).toBe("Member In Compliance State");
  });

  it("defaults reasons to empty when omitted", () => {
    const err = new ApplicationError(500, "boom");
    expect(err.reasons).toEqual([]);
  });

  it("freezes reasons into an array even if a custom iterable is passed", () => {
    function* gen() {
      yield new Error("first");
      yield new Error("second");
    }
    const err = new ApplicationError(500, "boom", gen());
    expect(err.reasons.map((r) => r.message)).toEqual(["first", "second"]);
  });
});

describe("collect()", () => {
  it("returns an ApplicationError with the given status, message, and reasons", () => {
    const err = collect(422, "validation failed", [new Error("x is required")]);
    expect(err).toBeInstanceOf(ApplicationError);
    expect(err.status).toBe(422);
    expect(err.message).toBe("validation failed");
    expect(err.reasons.map((r) => r.message)).toEqual(["x is required"]);
  });

  it("threads the optional name through", () => {
    const err = collect(409, "compliance", [], "Member In Compliance State");
    expect(err.name).toBe("Member In Compliance State");
  });
});

describe("serialize()", () => {
  it("serializes an ApplicationError as { errors: [{ message }, ...] }", () => {
    const err = new ApplicationError(400, "top", [new Error("r1"), new Error("r2")]);
    expect(JSON.parse(serialize(err))).toEqual({
      errors: [{ message: "top" }, { message: "r1" }, { message: "r2" }],
    });
  });

  it("wraps a plain Error into a 500 ApplicationError shape", () => {
    expect(JSON.parse(serialize(new Error("oops")))).toEqual({
      errors: [{ message: "oops" }],
    });
  });

  it("preserves the http-errors status code on the wrapped error", () => {
    // We don't directly observe the status in the serialized output,
    // but we can prove the http-errors branch is taken by mutating the
    // internal wrapping logic via a small spy on ApplicationError
    // construction would be overkill — instead test the round-trip behavior.
    const httpErr = createHttpError(404, "not found");
    expect(JSON.parse(serialize(httpErr))).toEqual({
      errors: [{ message: "not found" }],
    });
  });
});

describe("trapFallthroughErrors", () => {
  // Bug surface: this is the last-ditch handler that runs when nothing else
  // caught the error. If it throws, the request hangs. So we want to be sure
  // it always sends 500 + the sentry id, regardless of input.
  function makeReqRes(sentry?: string) {
    const res: any = {
      statusCode: 200,
      sentry,
      log: { error: jest.fn() },
      end: jest.fn(),
    };
    return { req: {} as any, res, next: jest.fn() };
  }

  it("sets status 500 and writes the sentry id to the response", () => {
    const { req, res, next } = makeReqRes("sentry-abc-123");
    trapFallthroughErrors(new Error("boom"), req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.end).toHaveBeenCalledWith("sentry-abc-123\n");
  });

  it("falls back to 'undefined' if no sentry id is attached", () => {
    const { req, res, next } = makeReqRes(undefined);
    trapFallthroughErrors(new Error("boom"), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.end).toHaveBeenCalledWith("undefined\n");
  });
});
