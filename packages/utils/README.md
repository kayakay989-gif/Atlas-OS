# @atlas/utils

Pure utility functions with no side effects and no framework dependencies.

## Responsibilities

- Generic helpers (`assertNever`, safe JSON parsing, etc.)
- Class name merging (`cn`) — added in Phase 7 with Tailwind

## Public API

- `@atlas/utils` — barrel export

## Dependencies

None at runtime (Phase 2). `clsx` + `tailwind-merge` added in Phase 7 for `cn()`.

## Does NOT belong here

- React hooks (colocate in `@atlas/ui` or app)
- Environment access (use `@atlas/config`)
- Domain-specific business logic
