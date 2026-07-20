# Job Abstraction — Atlas Sales OS

Background jobs must never import `@trigger.dev/sdk` outside the worker adapter.

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Job definitions | `packages/jobs` | Registry, validation, enqueue API |
| Payload schemas | `@atlas/types/jobs` | Zod schemas for job inputs |
| Worker adapter | `apps/worker/src/adapters/trigger.ts` | Trigger.dev SDK isolation |
| Job modules | `apps/worker/src/jobs/*.ts` | Register jobs via `createJob()` |

## Adding a job (M1+)

1. Define payload schema in `@atlas/types`
2. Create `apps/worker/src/jobs/my-job.ts` using `createJob()`
3. Export default from job file for Trigger.dev discovery
4. Enqueue via `enqueueJob('my-job', payload)` from application code

## Replacing Trigger.dev

1. Implement `JobRuntimeAdapter` in a new adapter file
2. Call `jobRegistry.bindAdapter(newAdapter)` at worker startup
3. Remove Trigger.dev adapter and dependency

See ADR-0007.
