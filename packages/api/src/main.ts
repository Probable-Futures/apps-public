import { createServer } from "http";
import { EOL } from "os";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { RewriteFrames } from "@sentry/integrations";

import { env, logger, debug, shutdown } from "./utils";
import { initApp } from "./app";
import { healthCheck } from "./database";

// This allows TypeScript to detect our global value
declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}
// eslint-disable-next-line  no-underscore-dangle
global.__rootdir__ = __dirname || process.cwd();

export default async function main(): Promise<void> {
  debug("initialize main");

  // Initialized before the app is built so that RewriteFrames and the Http
  // integration are in place for anything that runs during initApp.
  Sentry.init({
    dsn: "https://aeaefb2737ac49dc93ecf7bcc3113f33@o542309.ingest.sentry.io/5661879",
    environment: env.DEPLOY_ENV,
    integrations: [
      // Enable Production Sourcemaps
      new RewriteFrames({
        root: global.__rootdir__,
      }),
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // explicitly setup Postgres tracing
      new Tracing.Integrations.Postgres(),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });

  // Node terminates the process on an unhandled rejection; for a user-facing API
  // staying up is worth more, but each one is a real defect to chase down.
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
    Sentry.captureException(reason);
  });

  // Create our HTTP server
  const httpServer = createServer();

  // Make our application (loading all the middleware, etc)
  const app = await initApp({ httpServer });

  // Add our application to our HTTP server
  httpServer.addListener("request", app);

  shutdown.gracefulShutdown({ httpServer, healthCheck });

  process.stdout.write(EOL);

  httpServer.listen(env.PORT, () => {
    logger.info("listening on port %d", env.PORT);
  });
}

main().catch(async (e) => {
  process.stdout.write(EOL);
  logger.error("Fatal error occurred starting server!");
  logger.error(e);
  Sentry.captureException(e);
  // process.exit would otherwise kill the transport before the event is sent.
  await Sentry.flush(2000);
  process.stdout.write(EOL);
  process.exit(1);
});
