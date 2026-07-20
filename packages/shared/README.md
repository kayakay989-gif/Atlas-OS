# @atlas/shared

Cross-cutting application primitives: errors, constants, logging, and shared domain-agnostic helpers.

## Responsibilities

- `AppError` hierarchy and error serialization
- Application constants (`APP_NAME`, roles)
- Structured logger (Phase 10)
- Shared enums used across multiple packages

## Public API

- `@atlas/shared` — barrel export
- `@atlas/shared/errors` — error classes
- `@atlas/shared/constants` — constants

## Dependencies

None at runtime (Phase 2).

## Does NOT belong here

- Zod schemas (use `@atlas/types`)
- React components (use `@atlas/ui`)
- Vendor SDK wrappers (use `@atlas/providers` adapters)
