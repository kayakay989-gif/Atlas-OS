# @atlas/jobs

Background job abstraction — business code enqueues jobs here; Trigger.dev is hidden behind the worker adapter.

## Responsibilities

- Job registry, `defineJob`, `enqueueJob`
- Job payload validation via schemas from `@atlas/types`
- Retry and scheduling configuration types

## Public API

- `@atlas/jobs` — job definitions and enqueue API

## Dependencies

- `@atlas/shared` — errors
- `@atlas/types` — job payload schemas (via consumer apps)

## Does NOT belong here

- `@trigger.dev/sdk` imports (only in `apps/worker/src/adapters/trigger.ts`)
- Business workflow logic (define jobs in domain modules, register in worker)
