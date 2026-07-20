# ADR-0009: Pluggable Provider Architecture for Data Sources

**Status:** Accepted  
**Date:** 2026-07-19  
**Deciders:** Lead Architect, Product Owner

## Context

Company discovery and enrichment can draw from many sources: CSV imports, web crawling, search APIs, enrichment databases (Apollo, etc.), and custom integrations.

Coupling discovery logic to any single provider (e.g., Apollo) would:

- Create vendor lock-in and recurring cost dependency
- Prevent operators from choosing data sources appropriate to their compliance posture
- Make it impossible to combine sources or switch providers without rewriting business logic
- Limit commercial viability (customers have different data preferences)

## Decision

Implement a **Provider Architecture** where every discovery and enrichment source implements a common interface. Business logic operates on normalized data, never on provider-specific formats.

### Provider Interface

```typescript
interface DiscoveryProvider {
  readonly id: string
  readonly name: string
  readonly type: 'discovery' | 'enrichment' | 'contact'

  discover(input: DiscoveryQuery): Promise<ProviderResult<CompanyCandidate[]>>
  healthCheck(): Promise<ProviderHealth>
}

interface DiscoveryQuery {
  organizationId: string
  icpCriteria: IcpCriteria
  limit?: number
  cursor?: string
}

interface ProviderResult<T> {
  data: T
  metadata: {
    providerId: string
    fetchedAt: string
    creditsUsed?: number
    cursor?: string
  }
}
```

### Planned Providers

| Provider | Type | Milestone | Notes |
|----------|------|-----------|-------|
| `csv-import` | Discovery | M2 | Manual upload; zero external dependency |
| `firecrawl` | Discovery / Enrichment | M2 | Web extraction adapter |
| `google-search` | Discovery | M2+ | Public search results (when appropriate) |
| `apollo` | Enrichment | M2+ | Optional; adapter only |
| `custom-webhook` | Discovery | M3+ | User-defined HTTP endpoint |
| `manual` | Discovery | M1 | Operator-created company records |

New providers are added by implementing the interface and registering in the provider registry. **No changes to business logic required.**

### Provider Registry

```typescript
// packages/providers/src/registry.ts
class ProviderRegistry {
  register(provider: DiscoveryProvider): void
  get(id: string): DiscoveryProvider | undefined
  list(type?: ProviderType): DiscoveryProvider[]
  discoverFromAll(query: DiscoveryQuery, providerIds: string[]): Promise<MergedResults>
}
```

Organizations configure which providers are enabled in their settings. Campaign discovery runs against enabled providers only.

### Data Normalization

All provider output maps to internal entities before persistence:

```
Provider Raw Data → Normalizer → CompanyCandidate → Domain Validation → company.discovered event
```

Provider-specific fields stored in `metadata` JSON column, not in core schema.

### Provider Configuration

Each provider has org-scoped configuration:

```typescript
interface ProviderConfig {
  organizationId: string
  providerId: string
  enabled: boolean
  credentials?: EncryptedCredentials  // API keys, OAuth tokens
  settings?: Record<string, unknown>  // Provider-specific options
}
```

## Consequences

### Positive

- Zero vendor lock-in for discovery
- Operators choose data sources matching their compliance needs
- New providers added without touching qualification, outreach, or campaign logic
- CSV import works day one with no external API cost
- Commercial customers can bring their own data sources

### Negative

- Normalization layer adds development overhead
- Each provider needs its own adapter and tests
- Lowest-common-denominator data model may lose provider-specific richness (mitigated by metadata JSON)

### Neutral

- Provider package (`packages/providers`) created in M2
- Interface defined in M0/M1 for type consistency

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Apollo as primary source | Vendor lock-in; recurring cost; compliance concerns |
| Single Firecrawl-only source | Too limited for discovery at scale |
| Hard-coded source list | Not extensible; violates open-closed principle |
| Dynamic plugin loading | Over-engineered for v1; registry pattern sufficient |
