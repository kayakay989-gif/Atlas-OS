# ADR-0013: Structured Observability & Event-Aligned Logging

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Lead Architect

## Context

Logging must support production debugging, compliance audit, and future analytics — not just error recording. Our event-driven architecture (ADR-0002) defines domain events like `company.discovered` and `email.sent`. Observability should align with this event catalog.

## Decision

Build **structured, event-aligned logging** in `@atlas/shared` (Phase 10 of M0).

### Log Event Shape

```typescript
interface LogEvent {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  event: string          // aligns with domain events where applicable
  message: string
  context: {
    organizationId?: string
    userId?: string
    jobId?: string
    resourceType?: string
    resourceId?: string
    durationMs?: number
    [key: string]: unknown
  }
}
```

### Event-Aligned Log Names

Log `event` field uses the same dot-notation as domain events:

| Domain Event | Log Event | When |
|--------------|-----------|------|
| `company.discovered` | `company.discovered` | Discovery completes |
| `company.researched` | `research.completed` | Research job finishes |
| `lead.qualified` | `lead.qualified` | Qualification decision made |
| `email.sent` | `email.sent` | Send confirmed |
| `reply.received` | `reply.received` | Inbox parsed |

Domain events are persisted (outbox); logs are **ephemeral observability** with the same vocabulary.

### Implementation Rules

1. **JSON output in production** — parseable by log aggregators
2. **Human-readable in development** — pretty-print optional
3. **Never log secrets, PII, or full email bodies**
4. **Every job logs start + completion** with `durationMs`
5. **Errors include `code` from `AppError`** hierarchy

### Build vs Buy

We build a thin logger (~100 lines). No Datadog/Sentry in M0 — hooks reserved for M9.

## Consequences

### Positive

- Logs correlate with domain events and audit trail
- Future: log → metric pipeline without schema change
- Compliance-friendly structured output

### Negative

- Discipline required to use structured logger vs `console.log`

### Neutral

- Implemented in M0 Phase 10; enforced in coding standards

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| console.log only | Unparseable; no correlation |
| Pino/Winston immediately | ADR-0008; thin logger sufficient for M0 |
| External APM in M0 | Premature; M9 production hardening |
