---
paths:
  - "packages/maps/**/*.ts"
  - "packages/maps/**/*.tsx"
---

# Maps App Conventions (@probable-futures/maps)

Vite + React + TypeScript. Public map builder and interactive map. Also builds for WordPress embedding (`yarn build:wp`).

## Data Fetching (Apollo + PostGraphile)

- Use Apollo Client hooks (`useQuery`, `useMutation`, `useLazyQuery`). Queries are `gql` literals in `src/graphql/queries/`.
- GraphQL field names follow PostGraphile inflection (camelCase, `nodes`, connections, `condition:`). Verify names against an existing query or the schema - do not invent them.
- Conditional fetch via Apollo `skip`, not by mutating variables.
- The auth header (`api-key` / token) is attached by the `setContext` link in `App.tsx`; logout-on-401/403 by an `onError` link. Don't duplicate either.

## Styling

- **styled-components v5.** Prefer styled components over inline styles; PascalCase const names. Global styles in `globalStyles.ts`. Reuse styled helpers from `@probable-futures/components-lib/styles` where available.

## i18n

- Custom Context-based translations (`src/contexts/TranslationContext.tsx`). User-facing strings go through `translate("a.b.c", fallback)`.
- Add every new key to **all** locale files in `src/locales/` (`en`, `fr`, `es`, `zh`), not just `en.json`.

## WordPress embedding

- Some behavior is gated on embedded mode / `window.pfInteractiveMap`. When adding map features, consider the embedded path. Sentry and analytics are disabled when embedded / not in production.

## Mapbox / lifecycle

- Clean up every `setInterval`, `setTimeout`, listener, Mapbox event, and subscription in `useEffect` return.
- Call `map.remove()` and dispose `mapbox-gl-compare` instances on unmount; `createRoot` marker portals must `.unmount()`.

## Shared code & constants

- Cross-app types/constants belong in `@probable-futures/lib` (colors, sizes, dataset/map consts). Use them - don't hardcode values. Rebuild `lib` after changing it.
- Reuse `@probable-futures/components-lib` components before adding new shared UI.

## Env & Prohibited

- Frontend env via `import.meta.env.VITE_*`. No hardcoded external URLs or secrets.
- No `console.*` left in components/hooks/utils. No emojis. No new UI/styling libraries.
