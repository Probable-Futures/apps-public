import { GraphQLError } from "graphql";
import { camelCase } from "lodash";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";

import { isProd } from "./env";
import { notifySlack } from "./slack";
import { ApplicationError, statusFromError } from "./error";
import { User } from "../middleware/auth";
import { GENERIC_ERROR_MESSAGE } from "./constants";

/**
 * Normalizes and logs the error, then always hands it to `next` so the
 * chain keeps moving to `Sentry.Handlers.errorHandler()` and
 * `trapFallthroughErrors`, which are the only places that respond. Logging
 * only here (no `Sentry.captureException`) avoids double-reporting the same
 * error through Sentry's own error middleware two lines below in app.ts.
 */
export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const status = statusFromError(err);
  const normalized =
    err instanceof Error
      ? err
      : new ApplicationError(status, String(err?.message ?? "Unknown error"));

  if (status >= 500) {
    req.log?.error({ err: normalized, status }, "Request failed");
  } else {
    req.log?.warn({ err: normalized, status }, "Request rejected");
  }

  next(normalized);
};

const prodErrorMessage = GENERIC_ERROR_MESSAGE;

const ALL_PG_ERROR_PROPERTIES = [
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

export const ERROR_PROPERTIES_TO_EXPOSE = isProd ? ["code"] : ALL_PG_ERROR_PROPERTIES;

const pluck = (err: any, keys: string[] = ERROR_PROPERTIES_TO_EXPOSE): { [key: string]: any } => {
  return keys.reduce((memo, key) => {
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

const EXPECTED_PG_ERROR_CODES = new Set(Object.keys(ERROR_MESSAGE_OVERRIDES));

/**
 * Builds a low-cardinality Sentry tag from a GraphQL error path, e.g.
 * `allProjects.nodes.3.name` -> `allProjects.nodes.name`. Numeric list
 * indices are dropped so errors on different array elements of the same
 * field group into the same tag instead of fragmenting Sentry issues.
 */
function graphqlPathTag(path: GraphQLError["path"]): string {
  const segments = (path ?? []).filter((segment) => typeof segment !== "number");
  return segments.length > 0 ? segments.join(".") : "unknown";
}

/**
 * Reports a formatted GraphQL error to Sentry, unless it falls into one of
 * the expected/caller-fault categories below - those are logged only, so
 * that Sentry stays a signal for real bugs and infrastructure failures on
 * this public GraphQL surface.
 */
function reportGraphQLError(
  error: GraphQLError,
  req: Request & { auth?: User },
  code: string | null,
): void {
  const { originalError, path, locations } = error;
  const pathTag = graphqlPathTag(path);

  // Parse / validation / variable coercion errors have no originalError -
  // they're caller mistakes, not application or database failures.
  if (!originalError) {
    req.log?.warn({ err: error, graphqlPath: pathTag }, "GraphQL request error");
    return;
  }

  if (code && EXPECTED_PG_ERROR_CODES.has(code)) {
    req.log?.warn(
      { err: originalError, pgCode: code, graphqlPath: pathTag },
      "Expected GraphQL error",
    );
    Sentry.addBreadcrumb({
      category: "graphql",
      level: Sentry.Severity.Warning,
      message: `Expected GraphQL error (${code}) at ${pathTag}`,
      data: { code, path: pathTag },
    });
    return;
  }

  // A 4xx thrown deliberately by a custom plugin resolver (e.g. an
  // ApplicationError with a status field) - not a bug.
  if (statusFromError(originalError) < 500) {
    req.log?.warn({ err: originalError, graphqlPath: pathTag }, "GraphQL request rejected");
    return;
  }

  req.log?.error({ err: originalError, graphqlPath: pathTag }, "GraphQL request failed");

  Sentry.withScope((scope) => {
    scope.setTag("layer", "graphql");
    scope.setTag("graphql_path", pathTag);
    if (code) {
      scope.setTag("pg_code", code);
    }
    if (req.auth?.sub) {
      scope.setUser({ id: req.auth.sub });
    }
    scope.setContext("graphql", { path, locations });
    scope.setContext("postgres", pluck(originalError, ALL_PG_ERROR_PROPERTIES));
    if (code) {
      scope.setFingerprint(["graphql", code, pathTag]);
    }
    Sentry.captureException(originalError);
  });
}

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
    try {
      reportGraphQLError(error, req, code);
    } catch (reportingError) {
      req.log?.warn({ err: reportingError }, "Failed to report GraphQL error");
    }
    if (code === "42501") {
      res.statusCode = 401;
      if (isProd) {
        void notifySlack(
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
