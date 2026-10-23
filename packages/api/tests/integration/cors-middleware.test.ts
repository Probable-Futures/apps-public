/**
 * INTEGRATION TEST — CORS middleware (src/middleware/cors.ts)
 *
 * Boots the middleware on an in-memory Express app and checks the preflight response
 * the maps app gets before every GraphQL POST: it allows the api-key header and lets
 * the browser cache the answer for 2 hours.
 */

import express from "express";
import request from "supertest";
import cors from "../../src/middleware/cors";

function buildApp() {
  const app = express();
  app.use(express.json());
  cors(app);
  app.post("/graphql", (_req, res) => res.json({ data: {} }));
  return app;
}

describe("CORS middleware", () => {
  it("answers the GraphQL preflight with a 2-hour max age", async () => {
    const res = await request(buildApp())
      .options("/graphql")
      .set("Origin", "https://probablefutures.org")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "api-key,content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    expect(res.headers["access-control-allow-headers"]).toContain("Api-Key");
    expect(res.headers["access-control-max-age"]).toBe("7200");
  });

  it("keeps the origin allow-list on the GraphQL POST", async () => {
    const res = await request(buildApp())
      .post("/graphql")
      .set("Origin", "https://probablefutures.org")
      .send({ query: "{ __typename }" });

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://probablefutures.org");
  });
});
