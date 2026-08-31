---
name: prime
description: Load essential context for a domain/feature across the Probable Futures monorepo before starting work.
user-invocable: true
argument-hint: <domain or feature, e.g. "datasets", "partner enrichment", "compare maps">
---

# Prime Context

Warm up understanding of how a domain is structured across the monorepo, what patterns exist, and where the gaps are. Read silently - do not paste file contents, just note what you found.

Accepts an argument: the domain or feature (e.g. "datasets", "partner enrichment", "maps comparison", "tracking"). If `$1` is empty, ask the user what to prime on.

## Steps

### 1. Data model (the API contract)

- Grep `packages/db/migrations/committed/` and `migrations/current.sql` for the domain's tables, views, functions, and triggers.
- Note: which schema (`pf_public` vs `pf_private`), key columns, relations, PostGIS/geo columns, RLS policies, and which roles can read/write.

### 2. GraphQL exposure

- Decide whether the domain is auto-exposed by PostGraphile (from the tables/views above) or customized via a plugin in `packages/api/src/plugins/`.
- Find the frontend queries that use it: `packages/maps/src/graphql/queries/` and `packages/pro/src/graphql/`.

### 3. API (if non-GraphQL endpoints are involved)

- Routes: `packages/api/src/routes/<name>/` (`index.ts`, `parameters.ts`, `schema.json`).
- Services: `packages/api/src/services/` (mailchimp, ses, geocode, aws, donation, tracking).
- Auth scope enforced for this domain.

### 4. Background work

- Worker tasks: `packages/worker/src/tasks/` (and `services/`, `models/`, `types/`). Note what trigger or `addJob` call enqueues each task, the payload type, and any job chaining.

### 5. Frontend

- maps and/or pro: relevant `screens/`, `components/`, contexts (maps) or `store/` slices (pro), Apollo queries/mutations, and any polling loops.

### 6. Shared code

- `@probable-futures/lib` (`packages/lib/src/{types,consts,utils}`) and `@probable-futures/components-lib` for existing types/constants/components for this domain.

### 7. Infra (if relevant)

- Pulumi stacks in `infra/` (services, identity, foundation, analytics-report), Auth0 config, env/secrets the domain depends on.

## Output Summary

```
DOMAIN: <name>

DATABASE (packages/db)
- <table/view/function>: schema (public/private), key columns, geo?, RLS/roles

GRAPHQL
- Auto-exposed by PostGraphile, or plugin: <which>
- Frontend queries: <files>

API (if any)
- Routes / services involved, auth scope

WORKER (if any)
- task(s), enqueued by <trigger/addJob>, payload type, chaining

FRONTEND
- maps: screens/components/queries
- pro: screens/components/store slices/queries

SHARED (@probable-futures/lib / components-lib)
- types/constants/components that exist for this domain

INFRA (if relevant)
- stacks, Auth0, env/secrets

GAPS
- missing tests, missing frontend, missing migrations, etc.

DEPENDENCIES
- other domains/packages this interacts with
```
