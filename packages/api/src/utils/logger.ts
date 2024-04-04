import pino, { LoggerOptions } from "pino";
import pinoHttp, { Options as HttpLoggerOptions, AutoLoggingOptions } from "pino-http";

import { apiRoutes } from "./constants";

import { LOG_LEVEL, isProd } from "./env";

const loggerOpts: LoggerOptions = {
  level: LOG_LEVEL,
  prettyPrint: true,
};

export const logger = pino(loggerOpts);

let httpLoggerOpts: HttpLoggerOptions = {
  ...loggerOpts,
};

const autoLoggingOpts: AutoLoggingOptions = {
  ignorePaths: [apiRoutes.healthCheck],
};

if (isProd) {
  httpLoggerOpts = {
    autoLogging: autoLoggingOpts,
    ...httpLoggerOpts,
  };
}

export const httpLogger = pinoHttp(httpLoggerOpts);
