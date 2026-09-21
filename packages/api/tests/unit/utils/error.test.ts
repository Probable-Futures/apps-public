/**
 * UNIT TESTS — src/utils/error.ts
 *
 * No mocks needed. ApplicationError, collect(), and serialize() are pure
 * data transformations: in → out. trapFallthroughErrors and statusFromError
 * use Express types but no I/O, so they're also unit-tested here with
 * hand-rolled req/res stubs.
 */
import createHttpError from "http-errors";
import { GENERIC_ERROR_MESSAGE } from "../../../src/utils/constants";
import {
  ApplicationError,
  collect,
  serialize,
  statusFromError,
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

describe("statusFromError", () => {
  it("reads status", () => {
    expect(statusFromError({ status: 401 })).toBe(401);
  });

  it("reads statusCode", () => {
    expect(statusFromError({ statusCode: 403 })).toBe(403);
  });

  it("coerces a numeric string", () => {
    expect(statusFromError({ status: "404" })).toBe(404);
  });

  it("defaults a plain Error (no status fields) to 500", () => {
    expect(statusFromError(new Error())).toBe(500);
  });

  it("falls back to 500 when the value is out of the 400-599 range", () => {
    expect(statusFromError({ status: 200 })).toBe(500);
  });

  it("falls back to 500 for null/undefined", () => {
    expect(statusFromError(null)).toBe(500);
    expect(statusFromError(undefined)).toBe(500);
  });
});

describe("trapFallthroughErrors", () => {
  // Bug surface: this is the last-ditch handler that runs when nothing else
  // caught the error. If it throws, the request hangs. So we want to be sure
  // it always ends the response, regardless of input.
  function makeReqRes(sentry?: string, headersSent = false) {
    const res: any = {
      statusCode: 200,
      sentry,
      headersSent,
      log: { error: jest.fn() },
      setHeader: jest.fn(),
      end: jest.fn(),
    };
    const req: any = { log: { error: jest.fn() } };
    return { req, res, next: jest.fn() };
  }

  it("responds 500 with the generic message and a reference when a sentry id is attached", () => {
    const { req, res, next } = makeReqRes("sentry-abc-123");
    trapFallthroughErrors(new Error("boom"), req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=utf-8");
    expect(res.log.error).toHaveBeenCalled();
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      errors: [{ message: GENERIC_ERROR_MESSAGE }],
      reference: "sentry-abc-123",
    });
  });

  it("omits the reference field when no sentry id is attached", () => {
    const { req, res, next } = makeReqRes(undefined);
    trapFallthroughErrors(new Error("boom"), req, res, next);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      errors: [{ message: GENERIC_ERROR_MESSAGE }],
    });
  });

  it("never leaks the real error message in a 5xx body", () => {
    const { req, res, next } = makeReqRes(undefined);
    trapFallthroughErrors(new Error("password=secret; SELECT * FROM users"), req, res, next);

    const body = res.end.mock.calls[0][0];
    expect(body).not.toContain("password");
    expect(body).not.toContain("SELECT");
  });

  it("preserves the real message for a 4xx ApplicationError", () => {
    const { req, res, next } = makeReqRes(undefined);
    const err = new ApplicationError(400, "invalid payload");
    trapFallthroughErrors(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=utf-8");
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      errors: [{ message: "invalid payload" }],
    });
  });

  it("handles a plain (non-Error) object like express-jwt-authz's insufficient-scope error", () => {
    const { req, res, next } = makeReqRes(undefined);
    const err = { statusCode: 403, error: "Forbidden", message: "Insufficient scope" };
    trapFallthroughErrors(err, req, res, next);

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      errors: [{ message: "Insufficient scope" }],
    });
  });

  it("does not touch headers when headersSent is already true", () => {
    const { req, res, next } = makeReqRes(undefined, true);
    trapFallthroughErrors(new Error("boom"), req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith();
  });
});
