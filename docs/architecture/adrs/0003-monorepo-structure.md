# ADR-0003: Turborepo Monorepo Structure

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect

## Context

Atlas Sales OS has multiple deployable units (web app, background worker, Supabase edge functions) that share:

- TypeScript types and Zod validation schemas
- Database query functions
- AI gateway and prompt logic
- Email adapter interfaces
- Domain event definitions

Duplicating this logic across repositories or deploy targets creates drift, bugs, and maintenance burden.

## Decision

Use a **Turborepo monorepo** with **pnpm workspaces**:

```
apps/web          → Deployed to Vercel
apps/worker       → Deployed to Trigger.dev
packages/*        → Shared libraries (not independently deployed)
supabase/         → Database migrations and edge functions
```

### Package Manager: pnpm

- Efficient disk usage via content-addressable storage
- Strict dependency resolution prevents phantom dependencies
- Native workspace support

### Build Orchestration: Turborepo

- Incremental builds with remote caching (future)
- Task pipeline: `lint → typecheck → test → build`
- Parallel execution across packages

### Dependency Rules

```
apps/web       → may import packages/*
apps/worker    → may import packages/*
packages/*     → may import other packages/* (no circular deps)
                 → must NOT import apps/*
supabase/      → independent (Deno runtime for edge functions)
```

## Consequences

### Positive

- Single source of truth for types, validation, and business logic
- Atomic changes across app and worker in one PR
- Shared CI pipeline
- Refactoring is safe across package boundaries

### Negative

- Larger repository than single-app projects
- CI must be configured to only deploy changed apps
- New developers must understand monorepo conventions
- Supabase edge functions (Deno) cannot directly import packages (need bundling or duplication for edge-specific code)

### Neutral

- Package versioning is implicit (no npm publish); all packages are `@atlas/*` scoped internally

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Multi-repo with published packages | Overhead of versioning and publishing for a single team |
| Nx monorepo | Turborepo is simpler and sufficient for our scale |
| Single Next.js app (no monorepo) | Worker logic would duplicate shared code; no clean separation |
| npm/yarn workspaces | pnpm is faster and has stricter dependency isolation |
