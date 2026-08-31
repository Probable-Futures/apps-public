---
paths:
  - "packages/lib/**"
  - "packages/components-lib/**"
  - "packages/probable-futures-maps/**"
  - "packages/probable-futures-maps-html-generator/**"
---

# Shared / Published Library Conventions

These packages are published to npm under the `@probable-futures` scope and are consumed by the frontends and by external users. Treat shape changes as potentially breaking.

## @probable-futures/lib

- **Types, constants, and pure utilities only.** No React, no side effects, no I/O. It must be safe to import anywhere.
- Organized as `src/{consts,types,utils}` re-exported from `src/index.ts` (`export * as consts/types/utils`).
- Built with `tsc`. Run `yarn workspace @probable-futures/lib build` after changes so consumers see new types.

## @probable-futures/components-lib

- Shared **React components** + styled-component helpers. Depends on `@probable-futures/lib`. React/react-dom are **peer** dependencies - never bundle React.
- Organized as `src/{components,styles,contexts,hooks}` exported from `src/index.ts`. Built with Rollup (CJS + ESM + types).

## probable-futures-maps / -html-generator

- Embeddable map component library and static HTML generator. Depend on `lib` (and `components-lib`). Built before publish; build the upstream libs first.

## Publishing

- Versioning is manual: bump the package's `version` in `package.json` before the publish GitHub Actions workflow runs. Do not publish from a local machine.
- Because external consumers depend on these, removing/renaming an export is a breaking change - prefer additive changes and call out breaks explicitly.

## Prohibited

- No React or side effects in `@probable-futures/lib`.
- No bundling React into `components-lib` (keep it a peer dep).
- No `console.*` in published code. No emojis.
