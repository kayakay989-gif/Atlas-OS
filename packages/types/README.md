# @atlas/types

Shared TypeScript types and Zod validation schemas used across apps and packages.

## Responsibilities

- Runtime validation schemas (Zod) for API boundaries, jobs, and forms
- Shared TypeScript types inferred from schemas
- Domain type definitions that are not tied to a single package

## Public API

- `@atlas/types` — barrel export
- `@atlas/types/jobs` — job payload schemas

## Dependencies

- `zod` — runtime validation

## Does NOT belong here

- React component prop types (colocate with components in `@atlas/ui`)
- Database row types (use `@atlas/database/types`)
- Provider-specific vendor types (keep in `@atlas/providers` adapters)
