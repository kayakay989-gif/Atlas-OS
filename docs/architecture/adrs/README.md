# Architecture Decision Records (ADRs)

Architecture Decision Records document significant technical decisions, their context, and consequences. They provide a historical record of **why** the system is built the way it is.

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion; not yet approved |
| **Accepted** | Approved and in effect |
| **Deprecated** | No longer recommended; may still be in use |
| **Superseded** | Replaced by a newer ADR |

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./0001-tech-stack.md) | Tech Stack Selection | Accepted | 2026-07-17 |
| [0002](./0002-event-driven-architecture.md) | Event-Driven Architecture | Accepted | 2026-07-17 |
| [0003](./0003-monorepo-structure.md) | Turborepo Monorepo Structure | Accepted | 2026-07-17 |
| [0004](./0004-supabase-as-backend.md) | Supabase as Primary Backend | Accepted | 2026-07-17 |
| [0005](./0005-ai-provider-strategy.md) | Multi-Provider AI Strategy | Accepted | 2026-07-17 |
| [0006](./0006-email-deliverability-architecture.md) | Email Deliverability Architecture | Accepted | 2026-07-17 |
| [0007](./0007-scheduling-trigger-vs-supabase-cron.md) | Job Scheduling: Trigger.dev vs Supabase Cron | Accepted | 2026-07-17 |
| [0008](./0008-build-vs-buy-policy.md) | Build vs Buy — Third-Party Dependency Policy | Accepted | 2026-07-19 |
| [0009](./0009-provider-architecture.md) | Pluggable Provider Architecture for Data Sources | Accepted | 2026-07-19 |
| [0010](./0010-ai-agent-memory.md) | AI Agent Memory Architecture | Accepted | 2026-07-19 |
| [0011](./0011-provider-plugin-architecture.md) | Unified Provider Plugin Architecture | Accepted | 2026-07-20 |
| [0012](./0012-feature-flags-infrastructure.md) | Feature Flags Infrastructure | Accepted | 2026-07-20 |
| [0013](./0013-structured-observability.md) | Structured Observability & Event-Aligned Logging | Accepted | 2026-07-20 |
| [0014](./0014-performance-budgets.md) | Performance Budgets | Accepted | 2026-07-20 |

---

## How to Create a New ADR

1. Copy the template below into a new file: `NNNN-short-title.md`
2. Number sequentially (never reuse numbers)
3. Set status to `Proposed`
4. Submit for review via PR
5. On approval, change status to `Accepted`

To supersede an ADR, create a new ADR that references the old one and mark the old ADR as `Superseded`.

### Enforcement Rule (Effective M0+)

Every major architectural change after Milestone 0 must either:

1. **Update an existing ADR** (with changelog note in commit message), or
2. **Add a new ADR** (status: `Proposed` → `Accepted` via review)

Minor implementation details that don't affect architecture do not require an ADR. When in doubt, write one — they are cheap and permanent.

Pull requests that introduce new major dependencies must update [dependencies.md](../dependencies.md).

---

## ADR Template

```markdown
# ADR-NNNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](./XXXX-title.md)
**Date:** YYYY-MM-DD
**Deciders:** [Names or roles]

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

### Positive
- ...

### Negative
- ...

### Neutral
- ...

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| ... | ... |
```

---

## Related Documents

- [Architecture Overview](../overview.md)
- [Development Workflow](../../development/workflow.md)
