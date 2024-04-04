import { createTerminus, HealthCheck } from "@godaddy/terminus";
import { Server } from "http";
import { logger } from "./logger";
import { isDev, SHUTDOWN_TIMEOUT } from "./env";
import { apiRoutes } from "./constants";
import { extendDebugger } from "./debugger";

const debug = extendDebugger("shutdown");

// Signals we listen to for shutdown
const shutdownSignals = ["SIGTERM", "SIGINT"];

export type ShutdownAction = () => Promise<void>;

export const shutdownActions: ShutdownAction[] = [];

// Force node debugger to close if it's the dev environment
if (isDev) {
  shutdownActions.push(async () => {
    try {
      debug("closing inspector...");
      await require("inspector").close();
    } catch (err) {
      logger.error("Error closing inspector: %o", err);
    }
  });
}

// Executes upon receiving shutdown signals
const onSignal = (): Promise<PromiseSettledResult<ShutdownAction>[]> => {
  debug("Received shutdown signal");
  return Promise.allSettled(shutdownActions);
};

// Executes after all shutdown actions finish
const onShutdown = async () => {
  debug("Cleanup finished. Gracefully shutting down server");
};

// Log messages before shutting down
const shutdownLogger = (message: string, e: Error) => {
  if (e) {
    logger.error("Error during shutdown");
    logger.error("Message: %o", message);
    logger.error("Error: %o", e);
    return;
  }
  logger.info("Shutting down: %o", message);
};

interface IGracefulShutdown {
  httpServer: Server;
  healthCheck: HealthCheck;
}

export const gracefulShutdown = ({ httpServer, healthCheck }: IGracefulShutdown) => {
  shutdownActions.push(async () => {
    try {
      debug("Closing HTTP server connections");
      httpServer.close();
    } catch (err) {
      logger.error("Error closing HTTP server %o", err);
    }
  });

  createTerminus(httpServer, {
    healthChecks: {
      [apiRoutes.healthCheck]: healthCheck,
      verbatim: isDev,
      __unsafeExposeStackTraces: isDev,
    },
    signals: shutdownSignals,
    // After the supplied amount of milliseconds, terminus will force the server to shut down
    timeout: SHUTDOWN_TIMEOUT,
    onSignal,
    onShutdown,
    logger: shutdownLogger,
  });
};
