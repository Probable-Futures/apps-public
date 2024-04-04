import express, { Express } from "express";
import * as Sentry from "@sentry/node";
import { Server } from "http";

import { constants, error, httpLogger, extendDebugger, errorHandler } from "./utils";
import * as middleware from "./middleware";
import contact from "./routes/contact";
import auth from "./routes/auth";

const debug = extendDebugger("app");

const { apiRoutes } = constants;

export async function initApp({ httpServer }: { httpServer: Server }): Promise<Express> {
  debug("App Init");

  const app = express();

  /*
   * Getting access to the HTTP server directly means that we can do things
   * with websockets if we need to (e.g. GraphQL subscriptions).
   */
  app.set("httpServer", httpServer);

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(httpLogger);

  app.use(express.json());

  middleware.installCors(app);
  middleware.installHelmet(app);
  middleware.installAuth(app);
  middleware.installRateLimiter(app);
  middleware.installSessions(app);
  middleware.installPostgraphile(app);
  middleware.installUppyCompanion(app, httpServer);

  app.use(apiRoutes.contact, contact);
  app.use(apiRoutes.auth, auth);

  app.use(errorHandler);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(error.trapFallthroughErrors);

  debug("Finish App Init");
  return app;
}
