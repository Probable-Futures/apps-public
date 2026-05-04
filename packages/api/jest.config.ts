import type { Config } from "jest";

/**
 * Jest config for the api package.
 *
 * Two projects are defined so the suites can run in isolation:
 *   - unit:        pure functions / mocked I/O. No network, no DB, no Redis.
 *   - integration: spins up an Express app in-memory and drives it via supertest.
 *
 * Both projects share the same setup file, which seeds env vars and stubs the
 * `database.ts` module so importing source files does not open real Pg/Redis
 * connections at module load time.
 */
const baseProject: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        diagnostics: false,
      },
    ],
  },
};

const config: Config = {
  projects: [
    {
      ...baseProject,
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
    },
    {
      ...baseProject,
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
    },
  ],
};

export default config;
