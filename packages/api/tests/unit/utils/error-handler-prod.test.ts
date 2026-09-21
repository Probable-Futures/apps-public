/**
 * UNIT TESTS — src/utils/errorHandler.ts (handleGraphQLErrors), isProd=true.
 *
 * `ERROR_PROPERTIES_TO_EXPOSE` (and therefore what the client sees) is computed
 * at module load from `isProd`, so a separate file with `isProd` mocked before
 * import is used instead of `jest.resetModules` gymnastics - see
 * error-handler.test.ts for the dev/non-prod instance of these tests.
 *
 * The central claim under test: production clients must see exactly what they
 * see today (generic message, `{ code }` only) while Sentry still receives the
 * full, un-redacted Postgres error - proving the `ALL_PG_ERROR_PROPERTIES` split.
 */
const mockCaptureException = jest.fn();
const mockAddBreadcrumb = jest.fn();
const mockSetTag = jest.fn();
const mockSetUser = jest.fn();
const mockSetContext = jest.fn();
const mockSetFingerprint = jest.fn();
const mockWithScope = jest.fn((callback: (scope: unknown) => void) => {
  callback({
    setTag: mockSetTag,
    setUser: mockSetUser,
    setContext: mockSetContext,
    setFingerprint: mockSetFingerprint,
  });
});
const mockNotifySlack = jest.fn();

jest.mock("@sentry/node", () => ({
  addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  withScope: (...args: unknown[]) => mockWithScope(...args),
  Severity: { Warning: "warning" },
}));

jest.mock("../../../src/utils/slack", () => ({
  notifySlack: (...args: unknown[]) => mockNotifySlack(...args),
}));

jest.mock("../../../src/utils/env", () => ({
  ...jest.requireActual("../../../src/utils/env"),
  isProd: true,
}));

import { GraphQLError } from "graphql";
import { handleGraphQLErrors, ERROR_PROPERTIES_TO_EXPOSE } from "../../../src/utils/errorHandler";
import { GENERIC_ERROR_MESSAGE } from "../../../src/utils/constants";

function makeError(overrides: {
  message?: string;
  path?: ReadonlyArray<string | number>;
  originalError?: Error;
}): GraphQLError {
  return {
    message: overrides.message ?? "Something went wrong",
    locations: [{ line: 1, column: 1 }],
    path: overrides.path ?? ["allProjects", "nodes", "name"],
    originalError: overrides.originalError,
  } as unknown as GraphQLError;
}

function makePgError(code: string, extra: Record<string, unknown> = {}): Error {
  const err = new Error(`pg error ${code}`);
  Object.assign(err, { code }, extra);
  return err;
}

function makeReq(authSub?: string) {
  return {
    log: { warn: jest.fn(), error: jest.fn() },
    auth: authSub ? { sub: authSub } : undefined,
  } as any;
}

function makeRes() {
  return { statusCode: 200 } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWithScope.mockImplementation((callback: (scope: unknown) => void) => {
    callback({
      setTag: mockSetTag,
      setUser: mockSetUser,
      setContext: mockSetContext,
      setFingerprint: mockSetFingerprint,
    });
  });
});

it("collapses ERROR_PROPERTIES_TO_EXPOSE to just code in prod", () => {
  expect(ERROR_PROPERTIES_TO_EXPOSE).toEqual(["code"]);
});

describe("handleGraphQLErrors - reporting to Sentry (prod)", () => {
  it("captures an unexpected pg error code with the full un-redacted postgres context", () => {
    const originalError = makePgError("42P01", {
      detail: 'relation "bogus" does not exist',
      table: "bogus",
    });
    const error = makeError({
      path: ["allProjects", "nodes", 3, "name"],
      originalError,
    });
    const req = makeReq("auth0|user-123");

    handleGraphQLErrors([error], req, makeRes());

    expect(mockCaptureException).toHaveBeenCalledWith(originalError);
    expect(mockSetTag).toHaveBeenCalledWith("layer", "graphql");
    expect(mockSetTag).toHaveBeenCalledWith("graphql_path", "allProjects.nodes.name");
    expect(mockSetTag).toHaveBeenCalledWith("pg_code", "42P01");
    expect(mockSetUser).toHaveBeenCalledWith({ id: "auth0|user-123" });

    const postgresContextCall = mockSetContext.mock.calls.find(([key]) => key === "postgres");
    expect(postgresContextCall?.[1]).toMatchObject({
      detail: 'relation "bogus" does not exist',
      table: "bogus",
    });
  });

  it("does not capture a validation error with no originalError", () => {
    const error = makeError({ message: 'Cannot query field "bogus"' });
    const req = makeReq();

    handleGraphQLErrors([error], req, makeRes());

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(req.log.warn).toHaveBeenCalled();
  });

  it("does not capture an expected 42501 RLS error, logs a breadcrumb, sets 401, and notifies Slack in prod", () => {
    const originalError = makePgError("42501");
    const error = makeError({ originalError });
    const req = makeReq();
    const res = makeRes();

    handleGraphQLErrors([error], req, res);

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(401);
    expect(mockNotifySlack).toHaveBeenCalledTimes(1);
  });

  it("does not capture a 23505 conflict and preserves the NUNIQ override for the client", () => {
    const originalError = makePgError("23505", {
      table: "projects",
      constraint: "projects_name_key",
    });
    const error = makeError({ originalError });
    const req = makeReq();

    const [formatted] = handleGraphQLErrors([error], req, makeRes());

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(formatted.extensions.exception.code).toBe("NUNIQ");
  });

  it("returns the generic message and a code-only extensions.exception for every error, regardless of type", () => {
    const errors = [
      makeError({ originalError: makePgError("42P01", { detail: "boom", table: "t" }) }),
      makeError({ originalError: makePgError("42501") }),
      makeError({
        originalError: makePgError("23505", { table: "projects", constraint: "projects_name_key" }),
      }),
      makeError({ message: 'Cannot query field "bogus"' }),
    ];
    const req = makeReq();

    const formatted = handleGraphQLErrors(errors, req, makeRes());

    formatted.forEach((entry) => {
      expect(entry.message).toBe(GENERIC_ERROR_MESSAGE);
    });
    // The unexpected-code and validation errors fall back to the plain pluck,
    // which in prod only ever yields `code` (or nothing, for the validation error).
    expect(Object.keys(formatted[0].extensions.exception)).toEqual(["code"]);
    expect(Object.keys(formatted[3].extensions.exception)).toEqual([]);
    // The override map still adds its own client-facing fields (message/fields/code)
    // on top of the collapsed pluck - that behavior is unchanged by this work.
    expect(formatted[2].extensions.exception.code).toBe("NUNIQ");
  });
});
