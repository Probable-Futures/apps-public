/**
 * Jest setupFiles entry: runs ONCE before each test file's module graph loads.
 *
 * Two responsibilities:
 *   1. Seed every required env var that `src/utils/env.ts` reads at module
 *      load time. `env-var` throws if any `.required()` var is missing, so
 *      importing anything that transitively touches the env module would
 *      otherwise blow up at test collection time.
 *   2. Stub `src/database.ts` so it does NOT open a real Pg pool / Redis
 *      connection. Tests that need a fake redis client provide their own
 *      via `jest.mock(...)` in the test file; this setup just supplies a
 *      no-op default so module load is safe.
 */
const TEST_ENV: Record<string, string> = {
  NODE_ENV: "test",
  DEPLOY_ENV: "local",
  LOG_LEVEL: "silent",
  PORT: "5433",
  API_KEY: "test-api-key",
  MAILCHIMP_API_KEY: "test-mc-key",
  MAILCHIMP_API_ENDPOINT: "https://mc.test/api",
  MAILCHIMP_CONTACT_LIST_ID: "list-id",
  DATABASE_HOST: "localhost",
  DATABASE_PORT: "5432",
  DATABASE_NAME: "pf_test",
  DB_OWNER_ROLE: "owner",
  DB_OWNER_ROLE_PASSWORD: "owner-pw",
  DB_GRAPHILE_ROLE: "graphile",
  DB_GRAPHILE_ROLE_PASSWORD: "graphile-pw",
  DB_VISITOR_ROLE: "visitor",
  DB_AUTHENTICATED_ROLE: "authenticated",
  DB_PARTNER_ROLE: "partner",
  DB_ADMIN_ROLE: "admin",
  UPPY_COMPANION_AWS_KEY: "aws-key",
  UPPY_COMPANION_AWS_SECRET: "aws-secret",
  PRO_AWS_S3_BUCKET: "test-bucket",
  UPPY_COMPANION_AWS_S3_REGION: "us-east-1",
  UPPY_COMPANION_SECRET_KEY: "uppy-secret",
  AUTH0_DOMAIN: "test.auth0.com",
  AUTH0_API_IDENTIFIER: "https://api.test/",
  ROOT_URL: "https://test.local",
  SESSION_SECRET: "session-secret",
  UPPY_COMPANION_GOOGLE_DRIVE_KEY: "gdrive-key",
  UPPY_COMPANION_GOOGLE_DRIVE_SECRET: "gdrive-secret",
  REDIS_PASSWORD: "redis-pw",
  REDIS_PORT: "6379",
  REDIS_HOST: "localhost",
  MAPBOX_ACCESS_TOKEN: "mapbox-token",
  AUTH_MANAGEMENT_CLIENT_ID: "auth-mgmt-id",
  AUTH_MANAGEMENT_CLIENT_SECRET: "auth-mgmt-secret",
  AUTH_PRO_CLIENT_USER_DB_CONNECTION_NAME: "user-db",
  AUTH_FULL_USER_ROLE_ID: "full-user-role",
  AIRTABLE_ACCESS_TOKEN: "airtable-token",
  AIRTABLE_DONATION_BASE_ID: "appDonation",
  AIRTABLE_DONATION_TABLE_ID: "tblDonation",
  EVERY_DOT_ORG_ACCESS_TOKEN: "every-token",
  API_KEY_FOR_DONATE_ENDPOINT: "donate-key",
  API_KEY_FOR_IMPACT_TRACKING_ENDPOINT: "tracking-key",
  AIRTABLE_IMPACT_TRACKING_BASE_ID: "appTracking",
  AIRTABLE_IMPACT_TRACKING_TABLE_ID: "tblTracking",
  AIRTABLE_ACCESS_TOKEN_FOR_IMPACT_TRACKING: "tracking-airtable-token",
};

for (const [k, v] of Object.entries(TEST_ENV)) {
  if (process.env[k] === undefined) {
    process.env[k] = v;
  }
}

/**
 * Stub `src/database.ts` so test imports never open a real Pg pool or Redis
 * connection. Test files that exercise redis behavior should re-mock this
 * module locally with `jest.mock("../../src/database", () => ...)`.
 */
/**
 * Silence the chatty console.log / console.error calls inside source code
 * (e.g. `verifyToken` logs every request, `donate` logs Airtable error
 * payloads). Tests assert on return values, not stdout. Keeps `jest --verbose`
 * output readable. Re-mock in a specific test if you need to assert on log
 * output.
 */
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});

jest.mock("../src/database", () => {
  const fakeRedis = {
    HGETALL: jest.fn(async () => ({})),
    HSET: jest.fn(async () => 1),
    on: jest.fn(),
    connect: jest.fn(async () => undefined),
  };
  const fakePool = {
    connect: jest.fn(async () => ({
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn(),
    })),
    on: jest.fn(),
    query: jest.fn(),
  };
  return {
    redisClient: fakeRedis,
    rootPgPool: fakePool,
    authPgPool: fakePool,
    healthCheck: jest.fn(async () => ({})),
    ownerConnectionString: "postgres://test",
  };
});
