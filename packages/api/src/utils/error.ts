import { HttpError } from "http-errors";
import { ErrorRequestHandler } from "express";
import { pick } from "lodash";

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

export const trapFallthroughErrors: ErrorRequestHandler = (err, req, res, next) => {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.

  // @ts-ignore
  res.log.error;
  res.statusCode = 500;
  // @ts-ignore
  res.end(res.sentry + "\n");
};
