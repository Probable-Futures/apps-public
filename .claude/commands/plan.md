---
name: plan
description: Research the monorepo and produce a clear implementation plan for approval before any code is written.
user-invocable: true
argument-hint: <feature or change to plan>
---

# Plan

Research the codebase thoroughly, then produce a clear implementation plan for approval. Do **not** write any code until the plan is approved.

## Process

### 1. Restate the request

One sentence confirming what is being built/changed. If `$1` is empty, ask.

### 2. Research (use the Explore or code-explorer agent, or Grep/Read directly)

- Find the closest existing end-to-end implementation to follow as a pattern.
- Read the relevant migrations (`packages/db/migrations/committed/`, `current.sql`) for the data model.
- Check `packages/api/src/plugins/`, `routes/`, `services/` for API touch points.
- Check `packages/worker/src/tasks/` for related background jobs.
- Check `packages/maps` / `packages/pro` for the frontend touch points and Apollo queries.
- Check `@probable-futures/lib` / `components-lib` for existing shared types/components.

### 3. Decide the approach (this stack's key questions)

- **Is this a database change?** PostGraphile generates the GraphQL schema from Postgres, so most API shape changes are migrations (tables/views/functions/columns), not resolvers. Only reach for a PostGraphile plugin when the schema can't express it. State which approach and why.
- **Access control**: which Postgres role(s) + RLS policy + GRANTs, and which Auth0 scope gates the request.
- **Async work**: does this need a worker task? What enqueues it (Postgres trigger vs `addJob`)? Payload shape? Chaining?
- **Shared/published libs**: do `@probable-futures/lib` or `components-lib` change? That may be a breaking change for external consumers (version bump).
- **Frontend**: maps, pro, or both? Apollo queries/mutations, Redux state (pro), shared components, i18n keys (maps).

### 4. Identify all touch points

List every file to create or modify, grouped by package: db -> api -> worker -> lib/components-lib -> maps/pro -> infra.

### 5. Security & migration safety

- RLS coverage and role GRANTs for any new data; Auth0 scope enforcement; input validation at the API boundary; no secrets in code (Pulumi/SSM); no PII in logs/Sentry.
- `current.sql` idempotent? Locks on large tables? Backfill needed? (Committed migrations are immutable.)

### 6. Flag risks

- Breaking GraphQL changes (renamed/removed columns/functions) and breaking changes to published libs.
- New infra (Pulumi stack changes, cost), Auth0 config, new env/secrets.
- Geo/data-volume performance.

### 7. Output the plan

A numbered, step-by-step plan in dependency order (db -> shared libs -> api/worker -> frontend), with: what each step does, which files are created/modified, and commands to run (e.g. `yarn workspace @probable-futures/db watch`, lib build, typecheck, tests).

Then stop and wait for approval.
