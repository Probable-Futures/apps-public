---
name: code-review
description: Run a thorough review of all branch changes against Probable Futures conventions - correctness, GraphQL/Postgres/RLS, worker reliability, frontend lifecycle, and code quality. Use when the user asks to review code, check changes, look over a diff, verify conventions, or asks "did I miss anything" before merging. Triggers on "review", "check my code", "look over my changes", "code review", "audit my changes".
context: fork
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# Code Review - Probable Futures

Review all branch changes against this repo's conventions, then layer in deeper bug and security reasoning. Land at one prioritized list of findings, not three separate reports.

## Step 1 - Get the diff

- `git fetch origin main` (best-effort) then `git diff main...HEAD --stat` for the file summary.
- `git diff main...HEAD` for the full diff.

If the diff is empty, stop and report there is nothing to review. Group changed files by package: db, api, worker, lib/components-lib, maps, pro, infra.

## Step 2 - Dispatch parallel analysis

In a single tool call, kick off concurrently (subagents are read-only):

- **Bug + reasoning pass** - `Agent` with `subagent_type: code-explorer`, `model: opus`. Prompt it to trace the changed code's execution paths (request -> GraphQL/Postgres -> worker -> S3/Mapbox; and frontend data flow + lifecycle) and report BUGS / LIKELY BUGS / RISKS with file:line and a concrete trigger for each. Tell it to think hard. Focus areas below.
- **Lint + typecheck** - run `yarn lint` and `yarn typecheck` (or scope to affected packages, e.g. `yarn workspace @probable-futures/maps typecheck`). Capture failures.

While they run, do the convention checklist (Step 3) inline.

## Step 3 - Convention checklist (inline)

Only flag actual misses; don't pad with generic remarks.

### Database / migrations (packages/db)

- Changes are in `current.sql`, **not** in `committed/` (committed files are immutable).
- `current.sql` is **idempotent** (`create ... if not exists`, `create or replace function`, guarded drops).
- New tables/columns have correct `GRANT`s and RLS policies for the right roles (visitor / authenticated / admin / partner); placed in `pf_public` vs `pf_private` correctly.
- Renaming/removing a column or function is a **GraphQL breaking change** - is it intentional and coordinated with the frontends?

### API (packages/api - PostGraphile + Express)

- API shape changes are expressed in the schema (migration/view/function) where possible; a hand-written PostGraphile plugin is used only when the schema can't express it (and registered in `plugins/index.ts`).
- Auth scope enforced on protected endpoints (`pfpro:*`, `statistics:read`, `public:read`); request maps to the right Postgres role - visibility relies on RLS, not app code.
- Config via `env-var`; no hardcoded secrets/DSNs/URLs. Logging via pino/`extendDebugger` - **no `console.*`**. Errors don't leak SQL/stack traces/IDs. Sentry not re-initialized.

### Worker (packages/worker - graphile-worker)

- New tasks are snake_case files, registered in `tasks/index.ts`, with a typed payload.
- The enqueue path is correct (Postgres trigger vs `addJob`) and known.
- Effects are **idempotent / retry-safe** (graphile-worker retries on failure); large reads streamed (`pg-query-stream`); multi-write work is transactional; errors persisted by category. No `console.*`.

### Frontend (packages/maps, packages/pro)

- Server state via Apollo; conditional fetch via `skip`, not variable juggling. GraphQL field names match the PostGraphile schema.
- Auth via `useAuth0()` + the existing Apollo links (no duplicate auth/logout). pro features gated on Auth0 scopes, not ad-hoc roles.
- pro: global client state in Redux Toolkit, server state in Apollo cache (not Redux); Kepler customized via DI factories, not internals.
- Styling matches the app (maps: styled-components; pro: existing MUI/Emotion/styled approach); no new UI libraries.
- maps: new user-facing strings added to **all** locale files (en/fr/es/zh).
- Lifecycle: every `setInterval`/`setTimeout`/listener/subscription, Mapbox + Kepler instances, and `createRoot` cleaned up on unmount; polling loops (pro uploads/enrichment) guarded against unmount.
- No `console.*` left; no hardcoded URLs/secrets (`import.meta.env.VITE_*`).

### Shared / published libs (packages/lib, components-lib, probable-futures-maps\*)

- `@probable-futures/lib` stays types/constants/pure-utils only (no React, no side effects).
- `components-lib` keeps React as a peer dep.
- Removing/renaming an export is a breaking change for npm consumers - intentional? Version bumped?

### Infra (infra/)

- Correct stack and correct repo (infra submodule vs apps). No hardcoded env names. Secrets via Pulumi config/SSM. Least-privilege IAM (no wildcards). No manual production deploys.

### General code quality

- No emojis anywhere. No over-engineering / impossible-case handling. Shared types/constants in `@probable-futures/lib`, not duplicated. Names reflect intent. No silent data loss in filters/maps/transforms.
- Commits/PRs (if any in scope): conventional-commit titles with package scope; no AI attribution; not on a protected branch.

## Step 4 - Aggregate

When the streams return, merge into one prioritized list:

- Bug **BUGS** + lint/typecheck failures + security-critical convention misses (missing RLS/GRANT, leaked secret, unauth'd endpoint) -> **Blockers**
- Bug **LIKELY BUGS** + convention violations with runtime risk -> **Warnings**
- Bug **RISKS** + style/quality issues -> **Suggestions**

De-duplicate when the subagent and the inline checklist flag the same line.

## Step 5 - Report

```
BLOCKERS (must fix before merge):
- [file:line] <one-line summary>
  Why: <runtime/security impact, concretely>
  Fix: <specific change>

WARNINGS (should fix):
- [file:line] <one-line summary>
  Why: <impact>
  Fix: <specific change>

SUGGESTIONS:
- [file:line] <one-line summary>
```

Be specific with file paths and line numbers. If a pass returned nothing, say so for that pass. If there are no findings at all, say the diff is clean - don't manufacture issues.
