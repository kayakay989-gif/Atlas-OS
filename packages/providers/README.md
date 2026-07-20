# @atlas/providers

Pluggable provider interfaces for external services (ADR-0011).

Business logic must depend on these interfaces — never on vendor SDKs directly.

## Responsibilities

- Provider interface definitions (AI, email, discovery, search, storage, analytics)
- Provider registry and factory (added in M2+)
- Concrete adapter implementations live in domain packages or `apps/worker`

## Public API

- `@atlas/providers` — barrel export
- `@atlas/providers/ai`, `/email`, `/discovery`, `/search`, `/storage`, `/analytics`

## Dependencies

None at runtime (interfaces only).

## Does NOT belong here

- Vendor SDK imports (isolate in adapter modules)
- Business orchestration logic
- Database persistence
