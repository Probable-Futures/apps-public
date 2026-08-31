---
paths:
  - "packages/pro/**/*.ts"
  - "packages/pro/**/*.tsx"
---

# Pro App Conventions (@probable-futures/pro)

Vite + React + TypeScript. Access-restricted professional platform built around Kepler.gl, Redux Toolkit, MUI/Emotion, Apollo, Auth0, and Uppy/S3 dataset uploads.

## State (Redux Toolkit)

- Global client state lives in `src/store/`. Actions use `createAction(TYPE)` with a SCREAMING_SNAKE_CASE constant + camelCase creator (see `src/store/actions.ts`); reducers combined via `combineReducers<Reducer>()` (`src/store/store.ts`).
- **Server state stays in the Apollo cache, not Redux.**
- Kepler.gl has its own reducer integrated in `store.ts`. Customize Kepler through its dependency-injection factory pattern (custom `*Factory` with `.deps`, see `packages/pro/readme.md`) - never mutate Kepler internals.

## Data Fetching (Apollo + PostGraphile)

- Apollo hooks; `gql` queries in `src/graphql/`. PostGraphile inflection for field names - verify against existing queries.
- Conditional fetch via `skip`. Auth token attached by the configured `setContext` link.

## Auth0 & permissions

- Use `useAuth0()`. Gate features on Auth0 scopes (`pfpro:read`, `pfpro:write`, `pfpro:manage`) - not ad-hoc role strings.

## Uploads & enrichment (Uppy -> worker)

- File uploads use Uppy with `@uppy/aws-s3` (multipart) to S3, then a partner-dataset record is created and the backend trigger enqueues the worker job. The UI **polls** for processing/enrichment status.
- Polling loops must be cleaned up and guarded against unmount (cancelled flag / clear interval in `useEffect` return). Don't leak intervals across screen changes.

## Styling

- MUI + Emotion and styled-components coexist. Match the surrounding file's approach; don't introduce a third styling system into a component. No new UI libraries.

## Shared code & lifecycle

- Cross-app types/constants in `@probable-futures/lib`; reuse `@probable-futures/components-lib`. Rebuild libs after changing them.
- Clean up every interval/timeout/listener/Mapbox+Kepler subscription and `createRoot` on unmount.

## Env & Prohibited

- Env via `import.meta.env.VITE_*`. No hardcoded external URLs/secrets.
- No `console.*` left in code. No emojis.
