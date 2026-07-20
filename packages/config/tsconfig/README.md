# Shared TypeScript configuration

All packages and apps extend presets from this directory. Do not duplicate compiler options in individual `tsconfig.json` files.

## Presets

| File | Use for |
|------|---------|
| `base.json` | Source of truth for strict compiler options |
| `node-library.json` | Node-only packages (`shared`, `types`, `jobs`, etc.) |
| `react-library.json` | React component packages (`@atlas/ui`) |
| `nextjs-app.json` | Next.js App Router apps (`apps/web`) |

## Strict mode (enforced workspace-wide)

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `forceConsistentCasingInFileNames`

## Import conventions

**Prefer workspace package names** for cross-package imports:

```typescript
import { healthCheckJobPayloadSchema } from '@atlas/types/jobs'
import { AppError } from '@atlas/shared/errors'
```

Do not use deep relative paths across package boundaries (`../../../packages/types`).

### `@atlas/*` path aliases

TypeScript path aliases are **not** used for workspace packages. pnpm workspace protocol (`@atlas/types`) is the canonical import path. App-local aliases:

- `apps/web`: `@/*` → app root (Next.js convention only)

## Exceptions

`@ts-ignore` and `any` require a documented exception in code review. Prefer `unknown` + narrowing.
