# Architecture Overview — Atlas Sales OS

**Version:** 1.1  
**Status:** Accepted  
**Last Updated:** 2026-07-19

---

## System Context

Atlas Sales OS is a multi-tenant SaaS platform that orchestrates AI agents, background jobs, and email infrastructure to automate outbound sales workflows.

```mermaid
graph TB
    subgraph Users
        OP[Outbound Operator]
        LEAD[Sales Leadership]
        ADMIN[Platform Admin]
    end

    subgraph Atlas Sales OS
        WEB[Next.js Web App]
        API[Supabase Edge Functions / API Layer]
        JOBS[@atlas/jobs Abstraction]
        EVENTS[Event Bus]
        AGENTS[AI Agents]
        MEMORY[Memory Gateway]
        PROVIDERS[Provider Registry]
    end

    subgraph Data
        PG[(PostgreSQL / Supabase)]
        STORAGE[Supabase Storage]
    end

    subgraph External
        OPENAI[OpenAI]
        GEMINI[Gemini]
        FC[Firecrawl]
        PW[Playwright]
        GW[Google Workspace]
        RESEND[Resend]
    end

    OP --> WEB
    LEAD --> WEB
    ADMIN --> WEB
    WEB --> API
    API --> PG
    API --> EVENTS
    EVENTS --> JOBS
    JOBS --> AGENTS
    AGENTS --> MEMORY
    AGENTS --> PROVIDERS
    JOBS --> PG
    JOBS --> OPENAI
    JOBS --> GEMINI
    JOBS --> FC
    JOBS --> PW
    JOBS --> GW
    JOBS --> RESEND
    JOBS --> STORAGE
```

---

## Architectural Style

| Pattern | Application |
|---------|-------------|
| **Modular monolith (web)** | Single Next.js app with feature-based modules; extract services only when boundaries are proven |
| **Event-driven processing** | Domain events trigger async jobs (research, send, reply detection) |
| **Multi-tenant data isolation** | Row-level security (RLS) in PostgreSQL; `organization_id` on all tenant tables |
| **Hexagonal / ports & adapters** | External services (AI, email, crawl, jobs, providers) behind interfaces—no vendor SDKs in business logic |
| **CQRS-lite** | Write path via API/jobs; read path via optimized views/materialized queries where needed |

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                      │
│  Next.js App Router · React · shadcn/ui · Zustand       │
├─────────────────────────────────────────────────────────┤
│  Application Layer                                       │
│  Use cases · Command handlers · Query handlers           │
│  Zod validation · Authorization checks                   │
├─────────────────────────────────────────────────────────┤
│  Domain Layer                                            │
│  Entities · Value objects · Domain events · Business rules│
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                    │
│  Supabase client · Trigger.dev · AI providers            │
│  Email adapters · Crawl adapters · External APIs         │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  PostgreSQL · RLS policies · Migrations · Audit log      │
└─────────────────────────────────────────────────────────┘
```

---

## Bounded Contexts

The platform is divided into bounded contexts with explicit interfaces. No context reaches directly into another's internal tables.

| Context | Responsibility | Key Entities |
|---------|----------------|--------------|
| **Identity & Access** | Auth, orgs, roles, permissions | User, Organization, Membership, Role |
| **Discovery** | ICP config, company finding, crawling | ICPProfile, Company, CrawlJob |
| **Research** | AI analysis, enrichment, contact finding | ResearchReport, Contact, EnrichmentRecord |
| **Qualification** | Scoring, approval workflows | LeadScore, ApprovalRequest |
| **Outreach** | Copy generation, sequences, templates | Sequence, EmailDraft, Template |
| **Campaign** | Campaign lifecycle, scheduling, execution | Campaign, CampaignContact, SendRecord |
| **Deliverability** | Domains, mailboxes, reputation, suppression | Domain, Mailbox, SuppressionEntry, HealthScore |
| **Inbox** | Reply detection, classification, threading | InboundMessage, ReplyClassification |
| **Conversion** | Meetings, proposals, invoices, onboarding | Meeting, Proposal, Invoice, OnboardingFlow |
| **Analytics** | Metrics, learning, optimization | CampaignMetric, Experiment, Recommendation |
| **Compliance** | Audit logs, consent, regulatory config | AuditLog, ConsentRecord, CompliancePolicy |
| **Notification** | Alerts, digests, approval prompts | Notification, NotificationPreference |

---

## Event-Driven Architecture

Domain events decouple contexts. Events are persisted (outbox pattern) and processed by Trigger.dev workers.

### Example Event Flow: New Lead Discovered

```
1. Discovery job finds company matching ICP
2. Emits: company.discovered { companyId, icpId, source }
3. Research worker consumes → crawls website → emits: company.researched
4. Qualification worker consumes → scores lead → emits: lead.qualified | lead.rejected
5. If qualified + auto-approved: Outreach worker generates email → emits: outreach.generated
6. Campaign worker schedules send → emits: email.sent
7. Inbox worker monitors replies → emits: reply.received
8. Notification worker alerts operator → emits: notification.created
```

### Event Catalog (Initial)

| Event | Producer | Consumers |
|-------|----------|-----------|
| `company.discovered` | Discovery | Research, Analytics |
| `company.researched` | Research | Qualification, Analytics |
| `lead.qualified` | Qualification | Outreach, Notification |
| `lead.rejected` | Qualification | Analytics |
| `outreach.generated` | Outreach | Campaign, Notification |
| `outreach.approved` | Identity (human action) | Campaign |
| `email.sent` | Campaign | Deliverability, Analytics |
| `email.bounced` | Deliverability | Campaign, Suppression |
| `reply.received` | Inbox | Campaign, Notification, Conversion |
| `meeting.booked` | Conversion | Notification, Analytics |
| `proposal.approved` | Conversion | Campaign (send proposal) |
| `campaign.completed` | Campaign | Analytics, Learning |

---

## Multi-Tenancy Model

| Aspect | Approach |
|--------|----------|
| Isolation unit | Organization (workspace) |
| Data isolation | PostgreSQL RLS policies on `organization_id` |
| Auth | Supabase Auth with JWT claims including `org_id` and `role` |
| File storage | Supabase Storage buckets scoped by org prefix |
| Job context | Every job receives and validates `organizationId` via `@atlas/jobs` |
| Cross-tenant access | Forbidden at DB, API, and job layers |

---

## AI Agent Architecture

The platform is built **around AI agents**, not AI as a bolt-on. Each bounded context contains agents that can operate at configurable autonomy levels:

| Level | Name | Behavior |
|-------|------|----------|
| 0 | Manual | Human performs action |
| 1 | Assisted | AI suggests; human executes |
| 2 | Supervised | AI executes; human approves |
| 3 | Autonomous | AI executes within guardrails |
| 4 | Learning | AI executes and improves from memory |

### Agent Types (Progressive)

| Agent | Context | Milestone |
|-------|---------|-----------|
| Research Agent | Analyzes companies, websites, branding | M2 |
| Qualification Agent | Scores leads, recommends approve/reject | M3 |
| Outreach Agent | Generates personalized email sequences | M3 |
| Deliverability Agent | Monitors health, pauses at-risk campaigns | M4 |
| Inbox Agent | Classifies replies, triggers follow-ups | M5 |
| Learning Agent | Analyzes performance, recommends optimizations | M8 |

Every subsystem design question: **Can this become an autonomous agent?**

---

## AI Architecture

AI agents use a unified gateway and memory layer:

```
┌──────────────────────────────────────┐
│  AI Gateway (packages/ai)            │
│  · Provider routing (OpenAI/Gemini)  │
│  · Prompt registry                   │
│  · Token/cost tracking               │
│  · Retry & fallback                  │
│  · Output validation (Zod)           │
├──────────────────────────────────────┤
│  Memory Gateway (packages/ai/memory) │
│  · Company & interaction history     │
│  · AI decision records               │
│  · Performance & website snapshots   │
└──────────────┬───────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
 Research   Outreach   Learning
 Agent      Agent      Agent
```

### AI Design Rules

1. **Ground in data** — Every generation prompt includes structured research data and memory context.
2. **Validate output** — All AI responses parsed through Zod schemas before persistence.
3. **Track provenance** — Store prompt version, model, input hash, and output for audit.
4. **Human override** — Generated content is draft until approved (when configured).
5. **Cost awareness** — Log token usage per org per operation; set budgets.
6. **Memory-aware** — Agents pull relevant history via Memory Gateway, not raw DB queries.

See [ADR-0010](./adrs/0010-ai-agent-memory.md) for memory architecture.

---

## Provider Architecture

Discovery and enrichment sources are pluggable. Business logic never depends on Apollo, Firecrawl, or any specific provider.

```
┌─────────────────────────────────────┐
│  Discovery Service (business logic) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Provider Registry (packages/providers) │
├──────────┬──────────┬───────────────┤
│ CSV      │ Firecrawl│ Apollo (opt.) │
│ Import   │ Adapter  │ Adapter       │
└──────────┴──────────┴───────────────┘
```

All providers implement `DiscoveryProvider` interface. Organizations enable/configure providers per org. See [ADR-0009](./adrs/0009-provider-architecture.md).

---

## Job Orchestration Abstraction

Trigger.dev is the job runtime, but application code uses `@atlas/jobs`:

```
Event Handler → @atlas/jobs.enqueue() → packages/jobs → apps/worker/adapters/trigger.ts → Trigger.dev
```

No file outside `apps/worker/src/adapters/` may import `@trigger.dev/sdk`. See [ADR-0007](./adrs/0007-scheduling-trigger-vs-supabase-cron.md).

---

## Email Architecture

Email is a first-class subsystem, not an afterthought.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Campaign    │────▶│  Send Queue  │────▶│  Mailbox     │
│  Scheduler   │     │  (rate limit)│     │  Adapter     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐              ▼
                    │  Suppression │     ┌─────────────┐
                    │  List Check  │◀────│  Google WS / │
                    └──────────────┘     │  SMTP / Resend│
                                          └──────┬──────┘
                                                 │
                    ┌──────────────┐              ▼
                    │  Bounce/     │◀──── Inbound parsing
                    │  Reply Handler│
                    └──────────────┘
```

See [ADR-0006](./adrs/0006-email-deliverability-architecture.md) for deliverability decisions.

---

## Security Architecture

| Layer | Control |
|-------|---------|
| Authentication | Supabase Auth (email/password initially; SSO later) |
| Authorization | RBAC with org-scoped roles; enforced in RLS + application layer |
| API | Server-side only for sensitive operations; no secrets in client |
| Secrets | Environment variables via Vercel/Supabase; never in code |
| Audit | Immutable audit log for all state-changing operations |
| Input validation | Zod at every boundary |
| Rate limiting | Per-org API rate limits |
| Data encryption | At rest (Supabase default); in transit (TLS everywhere) |

See [Security Overview](../security/overview.md) for the full threat model.

---

## Deployment Architecture

| Component | Platform | Environment |
|-----------|----------|-------------|
| Web app | Vercel | Production, Preview, Development |
| Database | Supabase | Production, Staging |
| Edge Functions | Supabase | Production, Staging |
| Background jobs | Trigger.dev Cloud | Production, Staging |
| File storage | Supabase Storage | Production, Staging |

See [Deployment Guide](../operations/deployment.md) for CI/CD details.

---

## Key Technical Decisions

All major decisions are documented as ADRs:

| ADR | Decision |
|-----|----------|
| [0001](./adrs/0001-tech-stack.md) | Approved tech stack |
| [0002](./adrs/0002-event-driven-architecture.md) | Event-driven processing with outbox pattern |
| [0003](./adrs/0003-monorepo-structure.md) | Turborepo monorepo layout |
| [0004](./adrs/0004-supabase-as-backend.md) | Supabase as primary backend |
| [0005](./adrs/0005-ai-provider-strategy.md) | Multi-provider AI with abstraction layer |
| [0006](./adrs/0006-email-deliverability-architecture.md) | Email deliverability as core subsystem |
| [0007](./adrs/0007-scheduling-trigger-vs-supabase-cron.md) | Trigger.dev orchestration (abstracted via `@atlas/jobs`) |
| [0008](./adrs/0008-build-vs-buy-policy.md) | Build vs buy — minimize third-party dependencies |
| [0009](./adrs/0009-provider-architecture.md) | Pluggable discovery/enrichment providers |
| [0010](./adrs/0010-ai-agent-memory.md) | AI agent memory architecture |

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Availability | 99.5% uptime (MVP); 99.9% (production) |
| API response time | p95 < 500ms for dashboard queries |
| Job processing | Research job < 5 min per company |
| Email send latency | Queued within 1 min of scheduled time |
| Data retention | Configurable per org; audit logs immutable |
| Concurrent campaigns | 50+ per org without degradation |
| Security | Zero cross-tenant data leakage |

---

## Related Documents

- [Folder Structure Plan](./folder-structure.md)
- [ADRs](./adrs/README.md)
- [Security Overview](../security/overview.md)
- [Deployment](../operations/deployment.md)
- [Milestone Plan](../milestones/milestone-plan.md)
