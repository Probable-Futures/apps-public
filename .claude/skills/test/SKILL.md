---
name: test
description: Run and fix tests across the Probable Futures monorepo. Use when the user asks to run tests, fix failing tests, add test coverage, or check that changes don't break anything. Knows the per-package test runners (jest for api, vitest for maps) and how to scope runs to a domain.
context: fork
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Test - Probable Futures

Run the right test runner for the package, interpret failures, and fix them (or the code under test) without papering over real bugs.

## Test setup per package (know this before running)

- **api** (`packages/api`) - **jest** (ts-jest), split into two projects:
  - `yarn workspace @probable-futures/api test` - all
  - `yarn workspace @probable-futures/api test:unit` - `jest --selectProjects unit`
  - `yarn workspace @probable-futures/api test:integration` - `jest --selectProjects integration`
  - Tests live in `packages/api/tests/{unit,integration}/...`. Config: `packages/api/jest.config.ts`.
  - Integration tests may need the local Postgres/Redis stack up (`yarn start`) and a working `.env`.
- **maps** (`packages/maps`) - **vitest**:
  - `yarn workspace @probable-futures/maps test` - `vitest run` (CI mode)
  - `test:watch`, `test:ui` for interactive runs.
  - Tests are colocated in `__tests__/` folders under `src/`. Note `src/locales/__tests__/localeConsistency.test.ts` enforces that all locale files stay in sync - if you add an i18n key to one locale, add it to all.
- **pro** (`packages/pro`) - **no test suite configured yet** (`test` is a placeholder echo). Do not invent a runner; if asked to test pro logic, rely on `typecheck` and propose adding vitest only if the user wants it.
- **Cross-package**: `yarn test` runs `lerna run test` across all packages.

## To run a single test or pattern

- jest (api): `yarn workspace @probable-futures/api test -- <pathOrPattern>` (add `--selectProjects unit|integration` to scope).
- vitest (maps): `yarn workspace @probable-futures/maps test -- <pathOrPattern>`.

## Workflow

### 1. Scope

Identify which package(s) the change/request touches and run only those suites first - faster signal than the whole monorepo. Run `typecheck` for the package too (`yarn workspace <name> typecheck`); type errors often explain a failing or non-compiling test faster than the test output.

### 2. Run and read

Run the scoped suite. Read failures carefully:

- Is the **test** wrong (stale expectation, changed fixture, outdated snapshot) or is the **code** wrong (real regression)? Decide before editing - don't change a test just to make it green.
- For api integration failures: check whether it's an environment issue (DB/Redis not up, missing `.env`) vs a logic failure. Report environment issues rather than "fixing" them by deleting assertions.

### 3. Fix

- Fix the root cause. If the implementation is correct and the test is stale, update the test to match the new contract and explain why.
- New behavior should get coverage: add a test next to the existing ones following the package's conventions (api: `tests/{unit,integration}`; maps: a sibling `__tests__/` file).
- Cover the failure paths that matter for this stack: unauthorized (wrong Auth0 scope / role), invalid input, not-found, and worker validation/processing errors.

### 4. Verify

Re-run the scoped suite until green, then run `typecheck` and `lint` for the affected package. Report: what ran, what failed and why, what you changed, and whether any failure was environmental (and thus not fixed in code).

## Don't

- Don't weaken or delete assertions to force a pass.
- Don't skip/`.only` tests and leave them that way.
- Don't fabricate a pro test runner. Don't add new test frameworks without asking.
- Don't claim green without showing the run output.
