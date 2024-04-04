import pino, { LoggerOptions, Logger as PinoLogger } from "pino";
import { Logger as WorkerLogger } from "graphile-worker";
import { LogLevel } from "@graphile/logger";

import { LOG_LEVEL, isDev } from "./env";

const loggerOpts: LoggerOptions = {
  level: LOG_LEVEL,
  prettyPrint: isDev,
};

export const pinoLogger = pino(loggerOpts);

export const logger = new WorkerLogger((scope) => {
  const scopedLogger = pinoLogger.child(scope);

  return (level, message, meta) => {
    switch (level) {
      // @ts-ignore
      case LogLevel.ERROR:
        return scopedLogger.error(`%s`, message, meta);
      // @ts-ignore
      case LogLevel.WARNING:
        return scopedLogger.warn(`%s`, message, meta);
      // @ts-ignore
      case LogLevel.DEBUG:
        return scopedLogger.debug(`%s`, message, meta);
      // @ts-ignore
      case LogLevel.INFO:
      default:
        return scopedLogger.info(`%s`, message, meta);
    }
  };
});
