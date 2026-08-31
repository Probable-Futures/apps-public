# Probable Futures

Climate data and mapping platform. TypeScript monorepo using **Yarn (classic) workspaces + Lerna**. Node is pinned via Volta (`node 22.22.2`, `yarn 1.22.x`). This repo uses **yarn**, never npm.

## Delegation Policy

Specialist subagents exist for each domain. Route substantial work (new features, multi-file changes, anything spanning a whole package) through the matching subagent. The main thread may make small, low-risk edits directly (a one-line fix, a config tweak, answering a question). When in doubt, prefer the domain agent.

**Domain -> agent mapping** (use the `Agent` tool with `subagent_type`):

- **Maps / Pro frontends** (`packages/maps/**`, `packages/pro/**`, React, Apollo, Auth0, Mapbox GL, Kepler.gl, Redux, styled-components/MUI) -> `frontend-engineer`
- **API / Worker / DB** (`packages/api/**` PostGraphile + Express, `packages/worker/**` graphile-worker tasks, `packages/db/**` graphile-migrate migrations) -> `backend-engineer`
- **Infrastructure** (`infra/**` Pulumi stacks, AWS, Auth0, GitHub Actions deploy) -> `infra-engineer`
- **Cross-package planning / new features touching multiple layers** -> `architect` first (produces a plan), then domain agents
- **Codebase exploration / "where is X" / "how does Y work"** -> `code-explorer` (read-only) or the `Explore` agent

**Operating rules**:

- Brief the agent with full context (file paths, what to change, why) - it has no view of the conversation.
- Run independent agents in parallel (one message, multiple `Agent` tool calls).
- Verify the agent's work after it finishes - read the actual diff, don't trust the summary.

## Project Structure

```
packages/
  maps/        - @probable-futures/maps  - Public map builder + interactive map (Vite, React, Apollo, Auth0, Mapbox GL, styled-components, custom i18n)
  pro/         - @probable-futures/pro    - PF Pro platform (Vite, React, Kepler.gl, Redux Toolkit, MUI + Emotion, Apollo, Auth0, Uppy/S3)
  api/         - @probable-futures/api     - GraphQL API: PostGraphile on Express over Postgres+PostGIS (Auth0/JWT, Sentry, Redis, Uppy companion)
  worker/      - @probable-futures/worker  - graphile-worker background jobs (dataset processing, geocoding, enrichment, CSV/S3)
  db/          - @probable-futures/db      - graphile-migrate SQL migrations + DB roles/seeds (pf_public / pf_private schemas, PostGIS)
  lib/         - @probable-futures/lib                - Shared types, constants, pure utils (published to npm)
  components-lib/ - @probable-futures/components-lib   - Shared React components + styled helpers (published to npm)
  probable-futures-maps/ - Embeddable map component library (published to npm)
  probable-futures-maps-html-generator/ - Static map HTML generator (published to npm)
  maps-tour/   - Map tour content
  worker/      - background jobs (see above)
config/
  tsconfig/    - @probable-futures/tsconfig - Shared base/browser/node TS configs
infra/         - Pulumi IaC (git submodule -> Probable-Futures/infra): foundation, identity, services, analytics-report, slack-notifier, utils
data/          - Local seed data (data/seeds, gitignored)
docker/        - Local dev stack (nginx + TLS, postgres+postgis, redis)
```

## Common Commands

This is a Yarn workspaces repo. Run package scripts with `yarn workspace <name> <script>` from the root, or `yarn <script>` inside the package dir.

```bash
# Local stack (Docker: nginx, postgres+postgis, redis, graphql)
yarn start                 # docker compose up (nginx + graphql)
yarn stop                  # docker compose down
yarn status                # docker compose ps
yarn logs                  # docker compose logs
yarn start:both            # bring up the "other" services too

# Frontend dev servers (Vite)
yarn start:maps            # = yarn workspace @probable-futures/maps start  -> https://local.probablefutures.org/maps
yarn start:pro             # = yarn workspace @probable-futures/pro start    -> https://local.probablefutures.org/

# Cross-workspace (Lerna fan-out)
yarn build                 # lerna run build
yarn lint                  # lerna run lint
yarn typecheck             # lerna run typecheck
yarn test                  # lerna run test
yarn format                # prettier . --write

# Per-package examples
yarn workspace @probable-futures/maps typecheck
yarn workspace @probable-futures/maps test          # vitest
yarn workspace @probable-futures/api test            # jest (unit + integration)
yarn workspace @probable-futures/api dev
yarn workspace @probable-futures/worker dev

# Database migrations (graphile-migrate) - see packages/db/migrations/README.md
yarn workspace @probable-futures/db watch     # auto-applies current.sql on save (local dev)
yarn workspace @probable-futures/db commit     # freeze current.sql into committed/ (needs DATABASE_URL, SHADOW_DATABASE_URL, ROOT_DATABASE_URL)
yarn workspace @probable-futures/db uncommit   # roll back the last commit

# Publishing shared libs (manual version bump + GitHub Actions)
yarn workspace @probable-futures/lib build
```

## Architecture Essentials

- **GraphQL is schema-first from Postgres.** The API is [PostGraphile](https://graphile.org/postgraphile/): the GraphQL schema is auto-generated from the Postgres schema. To add/change API shape you usually change the **database** (migrations + functions/views), not hand-written resolvers. Custom GraphQL is added via PostGraphile plugins in `packages/api/src/plugins/`.
- **Two Postgres schemas + RLS.** `pf_public` (public-readable data: datasets, maps, climate data) and `pf_private` (partner uploads, enrichments). Access is governed by Postgres roles (visitor / authenticated / admin / partner) and Row Level Security, set up in `packages/db/scripts` and migrations.
- **PostGIS everywhere.** Coordinates, grids, and geo data use PostGIS. The API exposes climate data as GeoJSON points/polygons (`points`, `geotile` queries).
- **Background work runs through graphile-worker**, not a separate queue. Jobs are enqueued by Postgres triggers (e.g. `_500_upload` on `pf_partner_dataset_uploads`) or by `addJob(...)` chaining from another task. Tasks live in `packages/worker/src/tasks/` and are registered in `tasks/index.ts`.
- **Auth is Auth0 (OIDC/JWT).** The API validates JWTs via JWKS (`express-jwt`) or an API key; frontends use `@auth0/auth0-react` and attach the token through an Apollo `setContext` link. Permission scopes look like `pfpro:read`, `pfpro:write`, `pfpro:manage`, `statistics:read`, `public:read`.
- **Sentry on every runtime** (api, worker, maps, pro) - each has its own DSN. Don't add a second Sentry init.
- **Mapbox + S3.** Geocoding uses the Mapbox SDK (results cached in Redis). Partner files upload to S3 via Uppy (multipart), then the worker streams and processes them.
- **Env via `env-var` (backend) / `import.meta.env.VITE_*` (frontend).** Secrets live in per-package `.env` files (gitignored) sourced from 1Password. Never hardcode secrets or external URLs.

## Shared Package Boundaries

- `@probable-futures/lib` - types, constants, and pure (dependency-free, no-React) utilities only. Consumed by both frontends and the published map libs. No React, no side effects.
- `@probable-futures/components-lib` - shared React components + styled-component helpers. Depends on `lib`. React is a peer dependency.
- Both are published to npm under the `@probable-futures` scope. Bump the version in the package's `package.json` before the publish workflow runs. Changing them affects external consumers - treat shape changes as potentially breaking.

## Writing Conventions

- **No emojis** in code, UI labels, comments, or messages.
- **Comments describe the code as it stands**, not the process of writing it. No "Phase 1", no "previously this did X", no references to refactor steps or plans. Default to no comment unless it captures a non-obvious invariant or reason.
- Match the surrounding file's style. `printWidth` is 100, `trailingComma: all` (Prettier). Prettier runs on staged files via lefthook and on edited files via the Claude format hook.

## Git Conventions

- **Conventional-commit titles with a package scope.** Format: `type(scope): summary` where scope is the package (`maps`, `pro`, `api`, `worker`, `db`, `lib`, `infra`). Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`, `build`. Examples from history: `feat(maps): implement comparison maps`, `fix(pro): link share bugs`. A scope is optional for cross-cutting changes (`feat: percentile view enhancements`).
- **Shortcut story IDs** may be included where relevant, matching existing style: `sc-5959: ...` or a trailing `[sc-5956]`.
- **No Claude / Anthropic attribution anywhere.** Never add `Co-Authored-By: Claude`, "Generated with Claude Code", or any AI marker to commit messages, PR titles, PR descriptions, issue text, or comments. Anything on GitHub must read as human-authored.
- **Never commit on a protected branch.** `main`, `staging`, and `production` each auto-deploy. Before `git commit`, check `git branch --show-current`; if it's one of those, stop and ask which feature branch to use (or create one). All work lands on a feature branch.
- **Never push.** Leave commits local. The user runs `git push` themselves, only when they ask. This includes `git push --force` - never run any push variant unprompted.

## Deployment

Infrastructure is [Pulumi](https://www.pulumi.com/) (in the `infra` submodule). GitHub Actions previews infra changes on PRs and applies them on merges to `main`, `staging`, and `production` - each branch maps to its own stack. Frontend/library builds and npm publishes are also driven by `.github/workflows`. Do not deploy or publish manually; let the workflows run.

## Per-Package Rules

Detailed, path-scoped conventions live in `.claude/rules/`. Read the matching file before working in a package:

- `.claude/rules/maps.md` - packages/maps
- `.claude/rules/pro.md` - packages/pro
- `.claude/rules/api.md` - packages/api
- `.claude/rules/worker.md` - packages/worker
- `.claude/rules/db.md` - packages/db
- `.claude/rules/shared-lib.md` - packages/lib, components-lib, probable-futures-maps\*
- `.claude/rules/infra.md` - infra
