# Packages

Atlas Sales OS is a pnpm + Turborepo monorepo. All shared code lives under `packages/`.

## Package index

| Package | Purpose |
|---------|---------|
| `@atlas/config` | Environment validation, feature flags, shared tooling configs |
| `@atlas/database` | Supabase client factory and generated DB types |
| `@atlas/events` | Domain event catalog and helpers |
| `@atlas/jobs` | Background job abstraction (Trigger.dev hidden behind adapter) |
| `@atlas/providers` | Pluggable provider interfaces (AI, email, discovery, etc.) |
| `@atlas/shared` | App errors, constants, logging (Phase 10+) |
| `@atlas/types` | Shared TypeScript types and Zod schemas |
| `@atlas/ui` | shadcn/ui components and design tokens |
| `@atlas/utils` | Pure utility functions |

## Dependency rules

```
apps/*  →  packages/*
packages/*  →  packages/*  (no cycles)
packages/*  ↛  apps/*
```

### Allowed direction examples

- `apps/web` may import `@atlas/ui`, `@atlas/shared`, `@atlas/config`
- `@atlas/jobs` may import `@atlas/shared`, `@atlas/types`
- `@atlas/ui` may import `@atlas/utils`

### Forbidden

- Any `packages/*` importing from `apps/*`
- Business modules importing `@trigger.dev/sdk` (only `apps/worker/src/adapters/`)
- Vendor SDKs in `@atlas/providers` (interfaces only)

## Adding a new package

1. Create under `packages/<name>/` with `package.json`, `tsconfig.json`, `README.md`
2. Wire scripts into root `turbo.json` via standard `lint`, `typecheck`, `test`, `build`
3. Document in this file
4. Add an ADR if the package represents a major architectural decision
