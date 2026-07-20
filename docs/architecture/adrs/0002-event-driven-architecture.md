# ADR-0002: Event-Driven Architecture

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect

## Context

Atlas Sales OS orchestrates long-running, multi-step workflows: discover → research → qualify → generate → send → detect reply → follow up. These steps:

- Have different latency requirements (research takes minutes; send scheduling takes seconds)
- May fail independently and need retry
- Should be decoupled so new capabilities can subscribe to existing events
- Must be auditable for compliance

A synchronous request/response model cannot handle this workload.

## Decision

Adopt an **event-driven architecture** with the following components:

1. **Domain events** — Typed events emitted on state changes (e.g., `company.discovered`, `email.sent`)
2. **Transactional outbox** — Events written to an `outbox` table in the same DB transaction as the state change
3. **Trigger.dev workers** — Poll/process outbox entries and execute job handlers
4. **Event catalog** — Centralized event definitions in `packages/events`
5. **Idempotent handlers** — Every handler checks if the event was already processed before acting

### Event Naming Convention

```
{context}.{action}
```

Examples: `company.discovered`, `lead.qualified`, `email.bounced`, `reply.received`

### Outbox Pattern

```
BEGIN TRANSACTION
  UPDATE companies SET status = 'researched' WHERE id = $1
  INSERT INTO outbox (event_type, payload, organization_id) VALUES ('company.researched', $2, $3)
COMMIT
```

A Trigger.dev scheduled job processes unprocessed outbox entries every N seconds.

## Consequences

### Positive

- Contexts are decoupled; Research doesn't know about Campaign
- New features subscribe to events without modifying producers
- Failed jobs retry independently without affecting the originating transaction
- Full audit trail of what happened and when
- Natural fit for Trigger.dev's job model

### Negative

- Eventual consistency — UI must handle in-progress states
- Outbox adds a table and processing job to maintain
- Debugging distributed flows is harder than synchronous calls
- Duplicate event delivery requires idempotent handler design

### Neutral

- Event schema evolution requires versioning discipline
- Need to define SLAs for event processing latency

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Synchronous API chain | Research alone takes minutes; would timeout HTTP requests |
| Message queue (SQS/RabbitMQ) | Adds infrastructure; outbox + Trigger.dev achieves same with fewer moving parts |
| Supabase Realtime for events | Realtime is for client subscriptions, not job orchestration |
| Direct function calls between contexts | Tight coupling; violates bounded context boundaries |
| Temporal.io | Powerful but heavy for our team size; Trigger.dev is sufficient for v1 |
