import { HttpError } from "http-errors";
import { ErrorRequestHandler } from "express";
import { pick } from "lodash";

import { GENERIC_ERROR_MESSAGE } from "./constants";

type Reasons = Iterable<Error>;

namespace Symbols {
  export const serialize = Symbol("serialize");
}

export class ApplicationError extends Error {
  readonly reasons: ReadonlyArray<Error>;
  readonly status: number;

  constructor(status: number, message: string, reasons?: Reasons, name?: string) {
    super(message);
    this.reasons = [...(reasons ?? [])];
    this.status = status;
    if (name) {
      this.name = name;
    }
  }

  *[Symbols.serialize](): IterableIterator<{ message: string }> {
    yield pick(this, "message");
    for (const error of this.reasons) {
      yield pick(error, "message");
    }
  }
}

export function collect(
  status: number,
  message: string,
  reasons: Reasons,
  name?: string,
): ApplicationError {
  return new ApplicationError(status, message, reasons, name);
}

export function serialize(error: Error): string {
  if (error instanceof ApplicationError) {
    const errors = error[Symbols.serialize]();
    return JSON.stringify({ errors: [...errors] });
  }

  return serialize(
    new ApplicationError(error instanceof HttpError ? error.status : 500, error.message),
  );
}

/**
 * Reads a status code off an unknown thrown value, mirroring Sentry's own
 * `getStatusCodeFromResponse` so our threshold and Sentry's agree. Handles
 * plain objects (e.g. express-jwt-authz's `next({ statusCode, ... })`) as
 * well as Error/HttpError instances.
 */
export function statusFromError(error: unknown): number {
  const raw =
    (error as any)?.status ??
    (error as any)?.statusCode ??
    (error as any)?.status_code ??
    (error as any)?.output?.statusCode;
  const status = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return typeof status === "number" && !Number.isNaN(status) && status >= 400 && status <= 599
    ? status
    : 500;
}

/**
 * The single responder for the Express error chain. Runs last, after
 * `errorHandler` (logs + normalizes) and Sentry's `errorHandler()` (attaches
 * `res.sentry`), so it is the only place that can include the Sentry event
 * id in the response.
 */
export const trapFallthroughErrors: ErrorRequestHandler = (err, req, res, _next) => {
  const status = statusFromError(err);
  // Attached by `Sentry.Handlers.errorHandler()` earlier in the chain.
  const eventId = (res as any).sentry;

  (res.log ?? req.log)?.error({ err, status, eventId }, "Unhandled error");

  if (res.headersSent) {
    res.end();
    return;
  }

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // 5xx messages are replaced wholesale: a driver error can carry SQL, table
  // names or a connection string, and the real message is already in the log.
  const body =
    status >= 500
      ? { errors: [{ message: GENERIC_ERROR_MESSAGE }] }
      : JSON.parse(
          serialize(
            err instanceof Error
              ? err
              : new ApplicationError(status, String((err as any)?.message ?? "")),
          ),
        );

  // Present whenever Sentry accepted the error, so a caller can quote it.
  if (eventId) {
    body.reference = eventId;
  }

  res.end(JSON.stringify(body));
};
