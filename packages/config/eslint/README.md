# Shared ESLint configuration

## Usage

- **Root / packages:** `eslint.config.js` re-exports `packages/config/eslint/base.mjs`
- **Next.js app:** `apps/web/eslint.config.mjs` extends base + `eslint-config-next`

## Vendor SDK restrictions

| SDK | Allowed in |
|-----|------------|
| `@trigger.dev/sdk` | `apps/worker/src/adapters/` only |

Enforced via `no-restricted-imports` in `base.mjs`. Business packages and `apps/web` must never import orchestration SDKs directly.

## Adding rules

Update `base.mjs` for workspace-wide rules. App-specific rules belong in that app's `eslint.config.*`.
