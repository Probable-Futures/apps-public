/**
 * INTEGRATION TESTS — the Express error chain (src/app.ts, ~lines 52-62)
 *
 * app.ts composes three error-handling middlewares, in this exact order:
 *
 *   1. `errorHandler`               (src/utils/errorHandler.ts) - logs + normalizes, always
 *                                    calls `next`.
 *   2. `Sentry.Handlers.errorHandler({ shouldHandleError })` - reports to Sentry and stamps
 *                                    `res.sentry` with an event id, gated by `shouldHandleError`
 *                                    (status >= 500 or === 403).
 *   3. `error.trapFallthroughErrors` (src/utils/error.ts) - the only middleware that actually
 *                                    writes a response.
 *
 * An error-handling middleware that neither responds nor calls `next` leaves the request hanging
 * with no response at all. Every case here therefore implicitly asserts "does not hang": supertest
 * fails on the jest timeout if the chain regresses to swallowing an error.
 *
 * Nothing is mocked. We build a bare `express()` app, mount routes that each trigger one error
 * shape, then mount the same three real handlers `app.ts` uses - including the real
 * `@sentry/node` handler with no `Sentry.init()` call. This is deliberate: `Hub.captureException`
 * (see `node_modules/@sentry/hub/dist/hub.js`) generates and returns a `uuid4()` event id
 * regardless of whether a client is configured, so `Sentry.Handlers.errorHandler` still sets
 * `res.sentry` even with no DSN. That makes the presence/absence of a `reference` key in the
 * response body a direct, unmocked assertion of whether `shouldHandleError` admitted the error.
 *
 * `pino-http` is not mounted here (app.ts mounts it earlier in the chain, unrelated to this
 * error chain), so `req.log` is `undefined` for every request - this exercises the `req.log?.`
 * optional chaining in `errorHandler` and `res.log ?? req.log` in `trapFallthroughErrors`.
 */

import express from "express";
import request from "supertest";
import * as Sentry from "@sentry/node";

import { errorHandler, error } from "../../src/utils";
import { GENERIC_ERROR_MESSAGE } from "../../src/utils/constants";

function buildApp() {
  const app = express();
  app.use(express.json());

  app.post("/jwt-expired", (_req, _res, next) => {
    next(Object.assign(new Error("jwt expired"), { status: 401, name: "UnauthorizedError" }));
  });

  // Exactly the shape express-jwt-authz's `failWithError: true` hands to `next` - a plain
  // object, not an Error instance.
  app.post("/insufficient-scope", (_req, _res, next) => {
    next({ statusCode: 403, error: "Forbidden", message: "Insufficient scope" });
  });

  app.post("/boom", (_req, _res, next) => {
    next(new Error("boom"));
  });

  app.post("/validation-error", (_req, _res, next) => {
    next(new error.ApplicationError(422, "email is required"));
  });

  app.post("/late-error", (_req, res, next) => {
    res.status(200).send("ok");
    next(new Error("late"));
  });

  // The same three handlers, in the same order, as app.ts.
  app.use(errorHandler);
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError: (err) => {
        const status = error.statusFromError(err);
        return status >= 500 || status === 403;
      },
    }),
  );
  app.use(error.trapFallthroughErrors);

  return app;
}

describe("Express error chain", () => {
  it("401s an express-jwt-shaped UnauthorizedError, preserves its message, and excludes reference", async () => {
    const res = await request(buildApp()).post("/jwt-expired").send();

    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ errors: [{ message: "jwt expired" }] });
    expect(res.body).not.toHaveProperty("reference");
  });

  // NOTE: per the allowlist in app.ts (`status >= 500 || status === 403`), a 403 IS captured
  // to Sentry, so the body carries a `reference` the caller can quote, alongside the original
  // message. Before the chain was fixed this request hung with no response at all.
  it("403s a plain-object express-jwt-authz error and preserves its message", async () => {
    const res = await request(buildApp()).post("/insufficient-scope").send();

    expect(res.status).toBe(403);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.errors).toEqual([{ message: "Insufficient scope" }]);
    expect(typeof res.body.reference).toBe("string");
  });

  it("500s an unexpected Error with the generic message, includes reference, and never leaks the real message", async () => {
    const res = await request(buildApp()).post("/boom").send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      errors: [{ message: GENERIC_ERROR_MESSAGE }],
      reference: expect.any(String),
    });
    expect(res.text).not.toContain("boom");
  });

  it("400s malformed JSON from express.json() without hanging", async () => {
    const res = await request(buildApp())
      .post("/boom")
      .set("Content-Type", "application/json")
      .send('{"bad');

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("preserves a 200 already sent and does not throw when next() is called afterward", async () => {
    const app = buildApp();
    let caught: unknown;
    app.on("error", (err) => {
      caught = err;
    });

    const res = await request(app).post("/late-error").send();

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
    expect(caught).toBeUndefined();
  });

  it("preserves a 4xx ApplicationError's real message instead of the generic message", async () => {
    const res = await request(buildApp()).post("/validation-error").send();

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ errors: [{ message: "email is required" }] });
  });
});
