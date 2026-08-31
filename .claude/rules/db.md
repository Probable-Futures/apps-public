---
paths:
  - "packages/db/**"
---

# Database Conventions (@probable-futures/db - graphile-migrate)

Postgres + PostGIS. Migrations managed by graphile-migrate. This database also defines the GraphQL API shape (PostGraphile reads it) and is the access-control boundary (roles + RLS).

## Migration workflow

- **Edit only `migrations/current.sql`** during development. It must be **idempotent** (safe to re-run): `create ... if not exists`, `create or replace function ...`, `drop ... if exists` before recreate, etc.
- `yarn workspace @probable-futures/db watch` re-applies `current.sql` to your local DB on every save.
- **Never edit anything in `migrations/committed/`** - committed files are hashed and immutable. A change to already-committed SQL goes into a fresh `current.sql`.
- `yarn workspace @probable-futures/db commit` freezes `current.sql` into `committed/` (requires `DATABASE_URL`, `SHADOW_DATABASE_URL`, `ROOT_DATABASE_URL` from `packages/db/.env`, with host `localhost` when run outside Docker). `uncommit` reverses the last commit.
- Do not hand-create files in `committed/` or invent migration filenames - the tool does that.

## Schemas

- `pf_public` - public-readable data (datasets, maps, climate/grid data).
- `pf_private` - partner uploads, enrichments, and other restricted data.
- Choose the schema deliberately; it affects who can read the data via PostGraphile.

## Access control (in the database)

- Roles: visitor / authenticated / admin / partner (set up in `scripts/initDb.js`). Visibility is enforced by **GRANTs + Row Level Security**, not by application code.
- When adding a table/column, add the appropriate `GRANT`s and RLS policies for the relevant roles in the same migration.

## PostGIS / geo

- Use existing geo conventions: SRID 4326, the grid-coordinate hashing approach, and existing geometry column patterns. Check neighboring committed migrations before introducing new spatial structures.

## API impact

- Renaming/removing a column or function is a **GraphQL breaking change** (PostGraphile re-exposes it). Coordinate with the frontends and confirm before changing existing shapes. Use PostGraphile smart comments/tags where you need to rename or hide fields at the GraphQL layer.

## Seeds

- Seed data and CSV loading are handled by `scripts/seed.js` / `migrations/seed`. Don't commit large data files (seed CSVs live in `data/seeds`, gitignored).
