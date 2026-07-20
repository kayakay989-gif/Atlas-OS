# ADR-0011: Provider Plugin Architecture

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Lead Architect, Product Owner  
**Supersedes:** Extends [ADR-0009](./0009-provider-architecture.md)

## Context

Atlas Sales OS integrates with many external capabilities: AI models, email systems, search APIs, lead/discovery sources, file storage, and analytics. Coupling business logic to any single vendor creates lock-in, cost dependency, and compliance rigidity.

ADR-0009 covered discovery providers only. We need a **unified provider/plugin architecture** across all integration boundaries from M0 onward.

## Decision

All external integrations follow a **provider plugin pattern**. Business logic never imports vendor SDKs — it calls interfaces; adapters implement them.

### Directory Structure (planned — implemented progressively)

```
packages/providers/
├── ai/           # OpenAI, Gemini adapters
├── email/        # Resend, Google Workspace, SMTP adapters
├── search/       # Google Search, etc.
├── discovery/    # CSV, Firecrawl, Apollo, custom webhook
├── storage/      # Supabase Storage adapter
└── analytics/    # Internal first; external later if needed
```

### Core Principles

1. **Business logic is provider-agnostic** — Campaign code calls `emailProvider.send()`, not Resend SDK.
2. **One interface per capability** — `AIProvider`, `EmailProvider`, `DiscoveryProvider`, etc.
3. **Registry pattern** — Providers register by ID; org settings select active provider(s).
4. **Normalized output** — Adapters map vendor responses to internal types before business logic sees them.
5. **Test with fakes** — Every interface has an in-memory fake for unit tests.

### Example Interface Shape

```typescript
interface EmailProvider {
  readonly id: string
  send(message: OutboundMessage): Promise<SendResult>
  healthCheck(): Promise<ProviderHealth>
}
```

Business services receive `EmailProvider` via dependency injection — never construct adapters directly.

### Package Placement

| Layer | Location | Knows About |
|-------|----------|-------------|
| Business logic | `apps/web`, `apps/worker` jobs | Interfaces only |
| Provider interfaces | `packages/providers/*/types.ts` | Internal types |
| Vendor adapters | `packages/providers/*/adapters/` | Vendor SDKs |
| Registry | `packages/providers/registry.ts` | All registered providers |

## Consequences

### Positive

- Any provider swappable without changing business logic
- Multi-provider routing (AI fallback, email rotation) is natural
- Compliance: orgs choose their data sources
- Testability via fake providers

### Negative

- Adapter layer overhead for every integration
- Must maintain interfaces as vendors evolve

### Neutral

- `packages/providers/` scaffold created in M0 Phase 2; adapters added per milestone
- Discovery providers (ADR-0009) become `packages/providers/discovery/`

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Direct SDK calls in business logic | Vendor lock-in; untestable; violates ADR-0008 |
| Single "integrations" god module | No boundary between AI, email, discovery |
| Dynamic plugin loading (runtime) | Over-engineered for v1; registry pattern sufficient |
