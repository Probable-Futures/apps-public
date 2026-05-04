# `@probable-futures/api` tests

Jest + ts-jest, with two suites separated by directory and Jest project name.

## Running

```bash
yarn test                  # both suites
yarn test:unit             # unit only
yarn test:integration      # integration only
yarn test --watch          # watch mode (--selectProjects unit also works)
```

## Layout

```
tests/
├── README.md              ← this file
├── setup.ts               ← env-var seeding + global database/console mocks
├── unit/                  ← isolated, mocked I/O — fast (<1s per file)
│   ├── utils/
│   │   └── error.test.ts
│   ├── routes/
│   │   ├── contact-parameters.test.ts
│   │   └── tracking-parameters.test.ts
│   └── services/
│       ├── geocode.test.ts
│       ├── donation.test.ts
│       ├── mailchimp.test.ts
│       ├── auth-approveOpenDataAccess.test.ts
│       └── graphql-project.test.ts
└── integration/           ← in-process Express + supertest
    ├── auth-middleware.test.ts
    └── donate-route.test.ts
```

## Unit vs. integration — the rule we follow

|                       | **Unit**                                                              | **Integration**                                                       |
| --------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Imports**           | a single source module                                                | a router/middleware + Express                                         |
| **HTTP**              | none — call functions directly                                        | supertest drives a real Express app in-process                        |
| **External services** | mocked (Mailchimp, Airtable, Auth0, Mapbox, Redis, S3, SES, Postgres) | mocked at the boundary (we mock `node-fetch`, JWT verification, etc.) |
| **What it proves**    | the function's contract: inputs → outputs, branches, error paths      | middleware composition, route wiring, response codes/bodies           |
| **When it fails**     | the function's logic is wrong                                         | the middleware chain, route handler, or status mapping is wrong       |

A unit test imports one source file and exercises its public surface. An integration test boots an Express app with the real router/middleware and drives it via supertest — it exists when the bug surface is in _how the parts compose_, not in any one part.

We do **not** spin up a real Postgres or Redis here; integration in this project means "real Express, mocked external services." Tests that need real infra would live in a separate suite (we don't have one yet).

## Setup file (`tests/setup.ts`)

Runs once per test file, before that file's module graph loads. Two responsibilities:

1. **Seed env vars** — `src/utils/env.ts` calls `.required()` on most variables at module load time, so importing anything that transitively touches it would otherwise crash test collection. The setup file fills in safe placeholder values (no secrets).

2. **Stub `src/database.ts`** — the real module opens a Postgres pool and a Redis client when imported. The setup file replaces it with a no-op default. Tests that need to control redis behavior (e.g. `geocode.test.ts`) re-mock the module locally via `jest.mock("../../../src/database", ...)`.

3. **Silence chatty console output** — some source paths log to stdout/stderr (`verifyToken` logs every request; the donate route `console.error`s Airtable failures). We spy them to noop so test output is readable.

## What's covered today

| Source file                                                                                 | Type        | Tests |
| ------------------------------------------------------------------------------------------- | ----------- | ----- |
| [src/utils/error.ts](../src/utils/error.ts)                                                 | unit        | 11    |
| [src/routes/contact/parameters.ts](../src/routes/contact/parameters.ts)                     | unit        | 7     |
| [src/routes/tracking/parameters.ts](../src/routes/tracking/parameters.ts)                   | unit        | 7     |
| [src/services/geocode/geocode.ts](../src/services/geocode/geocode.ts)                       | unit        | 7     |
| [src/services/donation/request.ts](../src/services/donation/request.ts)                     | unit        | 9     |
| [src/services/mailchimp/mailchimp.ts](../src/services/mailchimp/mailchimp.ts)               | unit        | 9     |
| [src/services/auth/approveOpenDataAccess.ts](../src/services/auth/approveOpenDataAccess.ts) | unit        | 15    |
| [src/services/graphql/project.ts](../src/services/graphql/project.ts)                       | unit        | 10    |
| [src/middleware/auth.ts](../src/middleware/auth.ts)                                         | integration | 8     |
| [src/routes/donate/index.ts](../src/routes/donate/index.ts)                                 | integration | 8     |

These were chosen by ranking source files on **business risk × complexity × testability**: validation paths, money flows, auth gates, and code that has been the subject of recent bug fixes.

## Adding a test

- **Pure / mockable function** → `tests/unit/<area>/<name>.test.ts`. Mock external modules at the top with `jest.mock(...)`. Keep tests under a second.
- **Route or middleware** → `tests/integration/<name>.test.ts`. Build a minimal Express app, mount only the surface under test, drive it with supertest. Mock external services at the boundary (`node-fetch`, `express-jwt`, etc.).

Avoid putting integration tests under `unit/` and vice-versa — the Jest projects key off the directory.
