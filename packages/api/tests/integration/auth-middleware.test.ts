/**
 * INTEGRATION TESTS — src/middleware/auth.ts (via supertest)
 *
 * The auth.ts module is a side-effect-only `(app: Express) => void` that
 * registers middleware against /graphql and /upload. We can't reasonably
 * unit-test the middleware composition because the failure modes are about
 * how express-jwt + jwtAuthz + express-unless interact across the call
 * chain. So we boot a minimal Express app, wire up the real middleware,
 * and drive it with supertest.
 *
 * What we DO mock:
 *   - express-jwt (so we don't need a real Auth0 JWKS endpoint)
 *   - express-jwt-authz (so authorization passes when permissions look right)
 *
 * What we test (the bug surface):
 *   - GET /graphql with no auth headers at all → 401 (checkAuthHeaders)
 *   - GET /graphql with API_KEY header (correct) → 200, route runs
 *   - GET /graphql with API_KEY header (wrong)   → 401 (apiKeyAuth)
 *   - GET /graphql with Bearer token             → JWT path runs (200 if valid)
 *   - GET /upload/drive/* with no headers        → bypassed (Google Drive path)
 *   - GET /upload/<other> with no headers        → 401 (JWT required)
 */

// Mock express-jwt: pretend any Bearer "good" token is valid.
jest.mock("express-jwt", () => {
  return {
    expressjwt: () => {
      const mw = (req: any, _res: any, next: any) => {
        const auth = req.headers.authorization;
        if (auth === "Bearer good") {
          req.auth = { sub: "user-1", permissions: ["pfpro:read"] };
          return next();
        }
        const err: any = new Error("UnauthorizedError");
        err.status = 401;
        err.name = "UnauthorizedError";
        return next(err);
      };
      mw.unless = (filter: (req: any) => boolean) => {
        return (req: any, res: any, next: any) => (filter(req) ? next() : mw(req, res, next));
      };
      return mw;
    },
  };
});

// Mock express-jwt-authz: pass through unconditionally — we're not testing
// permission scopes here, only the auth-header routing logic.
jest.mock("express-jwt-authz", () => {
  return () => {
    const mw = (_req: any, _res: any, next: any) => next();
    mw.unless = (filter: (req: any) => boolean) => {
      return (req: any, res: any, next: any) => (filter(req) ? next() : mw(req, res, next));
    };
    return mw;
  };
});

// jwks-rsa: never actually called because expressjwt is fully mocked above,
// but it's referenced at module-load time. Stub it cheaply.
jest.mock("jwks-rsa", () => ({
  __esModule: true,
  default: { expressJwtSecret: () => () => "fake-secret" },
  expressJwtSecret: () => () => "fake-secret",
}));

import express from "express";
import request from "supertest";
import installAuth from "../../src/middleware/auth";

function buildApp() {
  const app = express();
  installAuth(app);
  // Echo handler so we can confirm a request reached the route.
  app.all("/graphql", (_req, res) => res.status(200).send({ ok: true }));
  app.all("/upload/drive/foo", (_req, res) => res.status(200).send({ ok: "drive" }));
  app.all("/upload/files/bar", (_req, res) => res.status(200).send({ ok: "files" }));
  // Custom error handler so JWT 401s don't fall through to express's default.
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err && err.status === 401) return res.sendStatus(401);
    res.sendStatus(500);
  });
  return app;
}

describe("/graphql — auth header routing", () => {
  const app = buildApp();

  it("401s when neither api-key nor authorization is present", async () => {
    const res = await request(app).get("/graphql");
    expect(res.status).toBe(401);
  });

  it("200s with a correct api-key header", async () => {
    const res = await request(app).get("/graphql").set("api-key", "test-api-key");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("401s with an INCORRECT api-key header (apiKeyAuth gate)", async () => {
    const res = await request(app).get("/graphql").set("api-key", "wrong");
    expect(res.status).toBe(401);
  });

  it("200s with a valid Bearer token (JWT path)", async () => {
    const res = await request(app).get("/graphql").set("Authorization", "Bearer good");
    expect(res.status).toBe(200);
  });

  it("401s with an invalid Bearer token", async () => {
    const res = await request(app).get("/graphql").set("Authorization", "Bearer bad");
    expect(res.status).toBe(401);
  });
});

describe("/upload — Google Drive bypass", () => {
  const app = buildApp();

  it("bypasses JWT for /upload/drive/* paths even with no Authorization header", async () => {
    const res = await request(app).get("/upload/drive/foo");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: "drive" });
  });

  it("requires JWT for non-drive /upload paths (no Authorization → 401)", async () => {
    const res = await request(app).get("/upload/files/bar");
    expect(res.status).toBe(401);
  });

  it("allows non-drive /upload paths with a valid JWT", async () => {
    const res = await request(app).get("/upload/files/bar").set("Authorization", "Bearer good");
    expect(res.status).toBe(200);
  });
});
