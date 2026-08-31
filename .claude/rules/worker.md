---
paths:
  - "packages/worker/**/*.ts"
---

# Worker Conventions (@probable-futures/worker - graphile-worker)

Background jobs over the same Postgres as the API. Handles partner-dataset processing, geocoding, and enrichment; uses Mapbox SDK, fast-csv, pg-format, pg-query-stream, S3, Redis.

## Tasks

- One task per file in `src/tasks/<task_name>.ts`. The file name and task key are **snake_case** (e.g. `process_partner_dataset`, `add_nearby_pf_coordinates_to_partner_dataset`, `enrich_partner_dataset`). Register every task in `src/tasks/index.ts`.
- Signature: `const task: Task = async (payload, { withPgClient, logger, addJob }) => { ... }`. Type the payload in `src/types/tasks.ts`.
- Chain follow-up work with `addJob("next_task", payload)`.

## How tasks get enqueued

- Many tasks are enqueued by **Postgres triggers**, not direct calls. Example: `_500_upload` on `pf_private.pf_partner_dataset_uploads` enqueues `process_partner_dataset` only when the row has `enrich = true` (the `enrich` flag historically means "process on insert"). Know the trigger/call site before changing a task's contract.

## Database & data handling

- Wrap multi-statement work in explicit `BEGIN`/`COMMIT`/`ROLLBACK` via the pg client.
- Stream large selects with `pg-query-stream` to bound memory; build bulk inserts with `pg-format`.
- Geocoding uses the Mapbox SDK with Redis caching - reuse the existing geocode service, don't re-implement.

## Reliability

- graphile-worker **retries** failed jobs - make effects idempotent and safe to re-run.
- Persist error categories the way existing tasks do (Unhandled Exception / Validation Error / Application Error) so the client can surface them.

## Config, logging, Sentry

- Config via `env-var` from `.env`. Log via the provided `logger` / pino - **never `console.*`**. Sentry initialized once in `main.ts`.

## Prohibited

- No `console.*`. No non-idempotent side effects. No hardcoded secrets/URLs. No emojis.
