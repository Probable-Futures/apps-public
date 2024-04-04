import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { RewriteFrames } from "@sentry/integrations";
import { EOL } from "os";
import { run } from "graphile-worker";
import { debug, pinoLogger, logger, env } from "./utils";
import { pgPool } from "./database";
import taskList from "./tasks";

// This allows TypeScript to detect our global value
declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}
global.__rootdir__ = __dirname || process.cwd();

Sentry.init({
  dsn: "https://096a45a001d644c0b78e8553b7382e30@o542309.ingest.sentry.io/5661870",
  environment: env.DEPLOY_ENV,
  integrations: [
    // Enable Production Sourcemaps
    new RewriteFrames({
      root: global.__rootdir__,
    }),
    new Tracing.Integrations.Postgres(),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

/**
 * How long to wait between polling for jobs in milliseconds
 * (for jobs scheduled in the future/retries)
 * Default: 2000
 */
const POLL_INTERVAL = 2000;
const CONCURRENT_JOBS = 1;

async function main() {
  debug("initialize main");

  const runner = await run({
    pgPool,
    // logger,
    pollInterval: POLL_INTERVAL,
    concurrency: CONCURRENT_JOBS,
    noHandleSignals: false,
    taskList,
  });

  // Capture unlogged events
  runner.events.on("worker:getJob:error", ({ error }) => {
    pinoLogger.error("Worker failed to get job: %o", error);
  });

  runner.events.on("worker:fatalError", ({ error, jobError }) => {
    pinoLogger.error("Worker suffered fatal error: %o", error);
    if (!!jobError) {
      pinoLogger.error("Job error: %o", jobError);
    }
  });

  runner.events.on("job:error", ({ job, error }) => {
    pinoLogger.error(job, "Job error occurred: %s", error);
  });

  runner.events.on("job:failed", ({ job, error }) => {
    pinoLogger.error(job, "Job failure occurred: %s", error);
  });

  runner.events.on("pool:listen:error", ({ error }) => {
    pinoLogger.error("Graphile worker pool error", error);
  });

  await runner.promise;
}

main().catch((e) => {
  process.stdout.write(EOL);
  pinoLogger.error("Error occured starting worker");
  pinoLogger.error(e);
  process.stdout.write(EOL);
  process.exit(1);
});
