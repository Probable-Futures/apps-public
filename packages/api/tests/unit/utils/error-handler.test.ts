/**
 * UNIT TESTS — src/utils/errorHandler.ts (handleGraphQLErrors), dev/non-prod behavior.
 *
 * isProd is false here (the default test NODE_ENV), so `ERROR_PROPERTIES_TO_EXPOSE`
 * is the full dev list. See error-handler-prod.test.ts for the isProd=true module
 * instance, which is what proves the Sentry reporter still gets un-redacted data
 * even when the client-facing allowlist collapses to `["code"]`.
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

import { GraphQLError } from "graphql";
import { handleGraphQLErrors } from "../../../src/utils/errorHandler";

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

describe("handleGraphQLErrors - reporting to Sentry", () => {
  it("captures an unexpected pg error code, tagging layer/graphql_path/pg_code and the user id", () => {
    const originalError = makePgError("42P01", { detail: "relation does not exist" });
    const error = makeError({
      path: ["allProjects", "nodes", 3, "name"],
      originalError,
    });
    const req = makeReq("auth0|user-123");

    handleGraphQLErrors([error], req, makeRes());

    expect(mockWithScope).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(originalError);
    expect(mockSetTag).toHaveBeenCalledWith("layer", "graphql");
    // Numeric list index dropped from the path tag.
    expect(mockSetTag).toHaveBeenCalledWith("graphql_path", "allProjects.nodes.name");
    expect(mockSetTag).toHaveBeenCalledWith("pg_code", "42P01");
    expect(mockSetUser).toHaveBeenCalledWith({ id: "auth0|user-123" });
    expect(mockSetFingerprint).toHaveBeenCalledWith(["graphql", "42P01", "allProjects.nodes.name"]);
  });

  it("does not capture a validation error with no originalError", () => {
    const error = makeError({ message: 'Cannot query field "bogus"' });
    const req = makeReq();

    handleGraphQLErrors([error], req, makeRes());

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockWithScope).not.toHaveBeenCalled();
    expect(req.log.warn).toHaveBeenCalled();
  });

  it("does not capture an expected 42501 RLS error but logs a breadcrumb, sets 401, and skips Slack in dev", () => {
    const originalError = makePgError("42501");
    const error = makeError({ originalError });
    const req = makeReq();
    const res = makeRes();

    handleGraphQLErrors([error], req, res);

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
    expect(mockAddBreadcrumb.mock.calls[0][0]).toMatchObject({
      category: "graphql",
      level: "warning",
    });
    expect(res.statusCode).toBe(401);
    expect(mockNotifySlack).not.toHaveBeenCalled();
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

  it("calls withScope once per error in a batch, each with its own graphql_path tag", () => {
    const errorA = makeError({
      path: ["projectA", "name"],
      originalError: makePgError("42P01"),
    });
    const errorB = makeError({
      path: ["projectB", "description"],
      originalError: makePgError("42P01"),
    });
    const req = makeReq();

    handleGraphQLErrors([errorA, errorB], req, makeRes());

    expect(mockWithScope).toHaveBeenCalledTimes(2);
    const graphqlPathCalls = mockSetTag.mock.calls.filter(([key]) => key === "graphql_path");
    expect(graphqlPathCalls.map(([, value]) => value)).toEqual([
      "projectA.name",
      "projectB.description",
    ]);
  });

  it("still returns a formatted two-element array even when Sentry.withScope throws", () => {
    mockWithScope.mockImplementation(() => {
      throw new Error("sentry is down");
    });
    const errorA = makeError({ originalError: makePgError("42P01") });
    const errorB = makeError({ originalError: makePgError("42P01") });
    const req = makeReq();

    const result = handleGraphQLErrors([errorA, errorB], req, makeRes());

    expect(result).toHaveLength(2);
    expect(req.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "Failed to report GraphQL error",
    );
  });
});
