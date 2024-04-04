import { GraphQLError } from "graphql";
import { camelCase } from "lodash";
import { ErrorRequestHandler, Request, Response } from "express";

import { isProd } from "./env";
import { sendSlackNotification } from "../services/slack-notfier";
import { User } from "../middleware/auth";

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: any,
) => {
  if (err.name === "UnauthorizedError") {
    req.log.error(err);
    res.status(err.status).send({ errors: [{ message: err.message }] });
    res.end();
  }
};

const prodErrorMessage = "An error occurred while processing your request.";

export const ERROR_PROPERTIES_TO_EXPOSE = isProd
  ? ["code"]
  : [
      "severity",
      "code",
      "detail",
      "hint",
      "position",
      "internalPosition",
      "internalQuery",
      "where",
      "schema",
      "table",
      "column",
      "dataType",
      "constraint",
      "file",
      "line",
      "routine",
    ];

const pluck = (err: any): { [key: string]: any } => {
  return ERROR_PROPERTIES_TO_EXPOSE.reduce((memo, key) => {
    const value =
      key === "code"
        ? // err.errcode is equivalent to err.code; replace it
          err.code || err.errcode
        : err[key];
    if (value != null) {
      //@ts-ignore
      memo[key] = value;
    }
    return memo;
  }, {});
};

/**
 * This map allows you to override the error object output to users from
 * database errors.
 *
 * See `docs/error_codes.md` for a list of error codes we use internally.
 *
 * See https://www.postgresql.org/docs/current/errcodes-appendix.html for a
 * list of error codes that PostgreSQL produces.
 */
export const ERROR_MESSAGE_OVERRIDES: { [code: string]: typeof pluck } = {
  "42501": (err) => ({
    ...pluck(err),
    message: "Permission denied (by RLS)",
  }),
  "23505": (err) => ({
    ...pluck(err),
    message: "Conflict occurred",
    fields: conflictFieldsFromError(err),
    code: "NUNIQ",
  }),
  "23503": (err) => ({
    ...pluck(err),
    message: "Invalid reference",
    fields: conflictFieldsFromError(err),
    code: "BADFK",
  }),
};

function conflictFieldsFromError(err: any) {
  const { table, constraint } = err;
  // TODO: extract a list of constraints from the DB
  if (constraint && table) {
    const PREFIX = `${table}_`;
    const SUFFIX_LIST = [`_key`, `_fkey`];
    if (constraint.startsWith(PREFIX)) {
      const matchingSuffix = SUFFIX_LIST.find((SUFFIX) => constraint.endsWith(SUFFIX));
      if (matchingSuffix) {
        const maybeColumnNames = constraint.substr(
          PREFIX.length,
          constraint.length - PREFIX.length - matchingSuffix.length,
        );
        return [camelCase(maybeColumnNames)];
      }
    }
  }
  return undefined;
}

export function handleGraphQLErrors(
  errors: readonly GraphQLError[],
  req: Request & {
    auth?: User;
  },
  res: any,
): Array<any> {
  return errors.map((error) => {
    const { message: rawMessage, locations, path, originalError } = error;
    //@ts-ignore
    const code = originalError ? originalError["code"] : null;
    const localPluck = ERROR_MESSAGE_OVERRIDES[code] || pluck;
    const exception = localPluck(originalError || error);
    const message = isProd ? prodErrorMessage : exception.message || rawMessage;
    if (code === "42501") {
      res.statusCode = 401;
      if (isProd) {
        sendSlackNotification(
          `Trying to access unauthorized resources: {${error.path?.toString()}} by ${
            req.auth?.sub
          }`,
        );
      }
    }
    return {
      message,
      locations,
      path,
      extensions: {
        exception,
      },
    };
  });
}
