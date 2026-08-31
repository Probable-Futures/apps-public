---
paths:
  - "infra/**"
---

# Infrastructure Conventions (Pulumi)

Cloud infrastructure as code with **Pulumi (TypeScript)**. `infra/` is a **git submodule** -> `Probable-Futures/infra`.

## Submodule boundary

- Changes under `infra/` belong to the `Probable-Futures/infra` repo, not `apps`. The `apps` repo only tracks the submodule ref (bumped by the `update-infra-ref` workflow). Be explicit with the user when work crosses this boundary.

## Stacks

- `foundation` - base networking / shared AWS foundation
- `identity` - IAM / identity
- `services` - application services (containers, Auth0, app infra); the largest stack
- `analytics-report` - analytics pipeline (Step Functions / Lambda)
- `slack-notifier` - Slack webhook notifications
- `utils` - shared Pulumi helpers/components

Put a resource in the stack that owns its type. Don't add app resources to `foundation`/`utils`.

## Rules

- **Pulumi only** - no second IaC tool, no click-ops for things that should be code.
- **Stack-scoped, never hardcoded** - resources must work across `main`/`staging`/`production` stacks; derive names/config from stack/config.
- **Secrets via Pulumi config secrets / SSM** (`pulumi config set --secret`, `config.requireSecret`) - never plaintext in code. Auth0 secrets, DB creds, API keys included.
- **Least-privilege IAM** - scope to specific ARNs/actions, no `*`. Review the existing role before widening.
- **Reuse** shared components in `utils` and cross-stack outputs (stack references) instead of duplicating resources.
- **Don't deploy manually** - GitHub Actions runs `pulumi preview` on PRs and `up` on merges to `main`/`staging`/`production`. Verify `yarn workspace <stack> typecheck` and a sane `pulumi preview`; never `pulumi up` against production ad hoc.
- **Tag resources** (Project / Environment / ManagedBy) where existing stacks do.

## Prohibited

- No hardcoded environment names or secrets. No wildcard IAM. No manual production deploys. No emojis.
