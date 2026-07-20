# @atlas/events

Domain event catalog and event factory helpers for the event-driven architecture.

## Responsibilities

- Domain event type definitions and name constants
- `createDomainEvent()` factory with metadata
- Event payload schemas (Zod)

## Public API

- `@atlas/events` — event catalog and helpers

## Dependencies

- `zod` — event payload validation

## Does NOT belong here

- Event bus transport (outbox, Trigger.dev — use `@atlas/jobs` and database layer)
- Business workflow orchestration
