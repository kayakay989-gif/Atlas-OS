# ADR-0008: Build vs Buy — Third-Party Dependency Policy

**Status:** Accepted  
**Date:** 2026-07-19  
**Deciders:** Lead Architect, Product Owner

## Context

Atlas Sales OS aims to be the best AI-powered outbound sales platform while remaining commercially viable. Excessive reliance on third-party SaaS tools creates:

- Recurring cost that scales with usage and erodes margins
- Vendor lock-in that limits customization and differentiation
- Integration fragility when vendors change APIs or pricing
- Reduced ability to build proprietary competitive advantages

However, building everything in-house is not always practical. Some capabilities require specialized infrastructure (email delivery infrastructure, managed PostgreSQL) that would take months to replicate.

## Decision

Adopt a **build-first, buy-when-necessary** policy with explicit evaluation criteria.

### Default: Build

Before recommending any third-party service, ask:

1. Can we build this ourselves without significant engineering cost?
2. Does building it create a competitive advantage?
3. Does building it reduce long-term SaaS costs?

If yes to any → prefer building.

### When Third-Party Is Acceptable

Use a third-party service only when **all** of the following are true:

| Criterion | Explanation |
|-----------|-------------|
| **High build cost** | Would require > 4 weeks of dedicated engineering for equivalent capability |
| **Not differentiating** | The capability is commodity infrastructure, not product IP |
| **Abstracted** | Wrapped behind our own interface; swappable without changing business logic |
| **Cost justified** | Total cost of ownership (license + integration + lock-in risk) is lower than build |

### Required Abstraction

Every third-party integration **must** be wrapped behind an internal interface in `packages/`:

```
Business Logic → Internal Interface → Adapter → Third-Party SDK
```

No business logic may import vendor SDKs directly. Adapters live in dedicated infrastructure modules.

### Approved Third-Party Services (With Rationale)

| Service | Category | Why Not Build | Abstraction |
|---------|----------|---------------|-------------|
| **Supabase** | Database, Auth, Storage | Managed PostgreSQL + Auth + RLS is months of infra work | `@atlas/database` client wrapper |
| **Vercel** | Hosting | Commodity CDN/edge deployment | Standard Next.js deploy |
| **Trigger.dev** | Job orchestration | Retry, observability, long-running jobs infrastructure | `@atlas/jobs` |
| **OpenAI / Gemini** | AI inference | Model training is not our business | `@atlas/ai` gateway |
| **Resend** | Transactional email | Deliverability infrastructure for system emails | `@atlas/email` adapter |
| **Google Workspace** | Outbound mailboxes | Full mailbox protocol implementation is impractical | `@atlas/email` adapter |

### Services to Evaluate Carefully (Prefer Build or Abstract)

| Service | Default Stance |
|---------|----------------|
| Apollo, ZoomInfo, etc. | **Provider adapter only** — never couple business logic (see ADR-0009) |
| Firecrawl | Adapter in provider layer; evaluate self-hosted crawl as alternative |
| Analytics SaaS | Build internal analytics first; add external later if needed |
| Feature flags SaaS | Environment variables + DB config initially |

### Cost Awareness

- Track monthly third-party spend per service
- Review quarterly: can we replace this with internal capability?
- Prefer usage-based services with clear off-ramps

## Consequences

### Positive

- Lower long-term SaaS costs as we own more of the stack
- Competitive differentiation from proprietary capabilities
- Reduced vendor lock-in through mandatory abstraction
- Clear decision framework prevents ad-hoc tool adoption

### Negative

- More initial engineering for capabilities that SaaS would provide instantly
- Team must maintain built components
- Abstraction layers add code (justified by swapability)

### Neutral

- Build vs buy reviewed per feature, not once globally
- Some third-party services remain permanently (managed DB, AI models)

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Buy everything (best-of-breed SaaS stack) | High cost, low differentiation, integration hell |
| Build everything | Impractical for DB hosting, AI models, email protocols |
| No policy (case-by-case ad hoc) | Leads to dependency creep and inconsistent architecture |
