---
name: security
description: Security audit of Probable Futures branch changes (or a named area), focused on what actually bites this stack - Postgres RLS policies and role GRANTs, pf_private data exposure, Auth0 scope enforcement, the public GraphQL surface, S3/Uppy upload paths, secrets handling, and input validation. Use when the user asks for a security review, "is this safe", "any vulnerabilities", "check permissions/access", or before exposing new data.
context: fork
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# Security Audit - Probable Futures

Find real, exploitable security issues in the changed code (or a named area). Be concrete: every finding names a file:line, a worked exploit ("which actor reaches which data/action, how"), and a fix. Don't manufacture findings to seem thorough.

Scope note: `docs/security.md` covers **AWS account monitoring** (GuardDuty, Config, Security Hub, CloudTrail) - infrastructure, not application logic. The application-security focus below comes from the architecture: access control lives in **Postgres (roles + RLS)** and at the **Auth0 boundary**, and the GraphQL API is **auto-generated from the database**.

## Setup

- `git diff main...HEAD --stat` and `git diff main...HEAD` for branch changes (or focus on the area the user named).
- Group changes: db migrations, api (plugins/routes/services/middleware), worker, frontends, infra.

For a large or high-stakes diff, dispatch a `code-explorer` subagent (`model: opus`, think hard) to trace data-exposure paths in parallel, then aggregate.

## The high-leverage checks for this stack

### 1. Row Level Security + GRANTs (the #1 risk here)

Because PostGraphile exposes the database directly, **access control is the RLS policy and the GRANT, not application code.** For every new or changed table/column/view/function in `packages/db/migrations/current.sql` (and the diff's committed migrations):

- Is RLS **enabled** on the table, and is there a policy that actually restricts rows to the intended role/owner? A table with a GRANT but no/over-broad RLS policy leaks every row.
- Are `GRANT`s scoped to the right roles (visitor / authenticated / admin / partner)? Did a `GRANT ... TO public` or to `visitor` accidentally expose private data?
- Is the object in the correct schema? Anything sensitive must be in **`pf_private`**, never `pf_public`. New data in `pf_public` is world-readable through the public API.
- Functions: is it `SECURITY DEFINER`? If so, does it bypass RLS and run with elevated rights on attacker-influenced input? Verify the function can't be called to read/write across tenants or escalate.
- Computed columns / views: do they re-expose `pf_private` data into a `pf_public`-readable view?

### 2. Auth0 scope enforcement at the API boundary

- Does each protected route/operation enforce the correct scope (`pfpro:read`, `pfpro:write`, `pfpro:manage`, `statistics:read`, `public:read`)? A write/manage operation guarded only by `pfpro:read` is a privilege gap.
- Is the JWT actually validated (JWKS via `express-jwt`) for the path, or does an unauthenticated/api-key path reach mutating logic?
- Does the request map to the intended Postgres role? A request running as a more privileged role than the user warrants defeats RLS.

### 3. Public GraphQL surface

- A new table/field/function auto-appears in the GraphQL schema. Confirm nothing newly queryable exposes PII, partner data, internal IDs, or admin-only fields to the public/visitor role.
- Smart comments/tags used to hide or rename fields - are they present where the field should not be public? PostGraphile omit tags are an access boundary; missing one re-exposes a field.

### 4. Partner uploads / S3 / worker

- Upload paths (Uppy -> S3): are object keys scoped per partner (`{partnerId}/...`) so one partner can't read/overwrite another's files? Are presigned URLs scoped and time-limited?
- Worker tasks process attacker-supplied CSVs: is the parsing bounded (size/row limits), and is dynamic SQL built with `pg-format` (not string concatenation) to prevent injection?
- Does any error message or generated file leak another partner's data or internal details?

### 5. Injection & input validation

- Raw SQL anywhere (`pgPool.query`, worker queries): parameterized or `pg-format`-escaped, never string-interpolated with user input.
- Express routes: input validated against the route's `parameters.ts` / `schema.json` before use.
- Geocoding / external calls: user input passed to Mapbox/HTTP is sanitized; no SSRF via user-controlled URLs.

### 6. Secrets, logging, transport

- No secrets, DSNs, API keys, or connection strings hardcoded in code or committed `.env`. Config via `env-var` / Pulumi config secrets.
- No secrets, tokens, full JWTs, raw emails/auth0 subs, or PII written to logs or Sentry.
- Frontend: no secret embedded in a `VITE_*` var that ships to the browser (anything `VITE_*` is public). API keys meant for the browser must be domain-restricted (e.g. Mapbox public token).

### 7. Frontend

- Auth token handled only via the configured Apollo link / Auth0; not persisted somewhere XSS-reachable.
- No `dangerouslySetInnerHTML` / `html-react-parser` on unsanitized server or user content.

## Output

Group by severity, most actionable first:

```
CRITICAL (exploitable now, data exposure or privilege escalation):
- [file:line] <summary>
  Exploit: <which actor reaches what, concretely>
  Fix: <specific change>

HIGH:
- [file:line] <summary> - Exploit / Fix

MEDIUM:
- [file:line] <summary> - Risk / Fix

LOW / hardening:
- [file:line] <summary>
```

For RLS/GRANT findings, state the role and the rows/columns exposed. If a pass found nothing, say so. If the diff is clean, say it's clean.
