# ADR-0007: Job Scheduling — Trigger.dev vs Supabase Cron

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect

## Context

Atlas Sales OS requires background job processing for:

- Company research (1–5 minutes per company, involves web crawling + AI)
- Email send scheduling (thousands of sends with rate limiting)
- Reply detection (polling inboxes every few minutes)
- Outbox event processing (continuous)
- Campaign analytics aggregation (periodic)
- Mailbox warm-up scheduling (daily)
- Health score recalculation (hourly)

These jobs vary in duration (seconds to minutes), frequency (continuous to daily), and complexity (simple DB query to multi-step AI pipeline).

We need to choose between Supabase Cron (pg_cron) and Trigger.dev for job orchestration.

## Decision

Use **Trigger.dev** as the primary job orchestration platform. Use **Supabase Cron** only for simple, database-local scheduled tasks.

### Trigger.dev — Primary (apps/worker)

| Job Category | Examples |
|--------------|---------|
| Long-running workflows | Research company, generate outreach, crawl website |
| Event processing | Outbox consumer, reply detection |
| Campaign execution | Send scheduler, follow-up processor |
| External API calls | AI inference, Firecrawl, Google Workspace, email send |
| Retry-heavy work | Any job that may fail and needs exponential backoff |

### Supabase Cron — Secondary (supabase/functions)

| Task | Schedule | Why Cron |
|------|----------|----------|
| Outbox cleanup (processed entries > 30 days) | Daily | Simple DELETE query |
| Materialized view refresh | Hourly | Database-only operation |
| Stale job detection | Every 15 min | Simple status check query |

### Why Trigger.dev Over Supabase Cron

| Capability | Trigger.dev | Supabase Cron |
|------------|---------------|---------------|
| Max job duration | 15+ minutes (configurable) | ~60 seconds (Edge Function limit) |
| Retry with backoff | Built-in | Manual implementation |
| Job observability | Dashboard with logs, traces | Supabase logs only |
| External API calls | Native (Node.js runtime) | Edge Function (Deno, limited) |
| Concurrency control | Built-in queue management | Not available |
| Job chaining | Native (trigger child jobs) | Not available |
| Playwright/browser automation | Supported (Node.js) | Not possible in Edge Functions |
| Development experience | Local dev server, CLI | Deploy to test |
| Cost at scale | Free tier + usage-based | Included in Supabase plan |

### Trigger.dev Configuration

```typescript
// apps/worker/trigger.config.ts
export default {
  project: "atlas-sales-os",
  runtime: "node",
  maxDuration: 300, // 5 minutes default; extend for research jobs
}
```

Job definitions use Trigger.dev's SDK with typed payloads validated via Zod.

### Vendor Abstraction Requirement

Trigger.dev is the **implementation**, not the **interface**. All application and business code interacts with `@atlas/jobs`, never with `@trigger.dev/sdk` directly.

```
Business Logic / Event Handlers
        ↓
   @atlas/jobs (defineJob, enqueueJob, scheduleJob)
        ↓
   apps/worker/src/adapters/trigger.ts  ← only file importing Trigger.dev SDK
        ↓
   Trigger.dev Cloud
```

Rules:
- `packages/jobs` defines job types, registry, and enqueue API
- `apps/worker` contains Trigger.dev adapter and job registration
- Replacing Trigger.dev requires changing only the adapter layer
- Job payloads validated with Zod at the `@atlas/jobs` boundary

## Consequences

### Positive

- Research jobs can run for minutes without timeout
- Playwright browser automation runs in Node.js worker
- Built-in retry, observability, and concurrency control
- Local development with hot reload
- Job dashboard for debugging production issues

### Negative

- Third hosted service to manage (alongside Vercel and Supabase)
- Additional cost at scale (free tier covers development)
- Team must learn Trigger.dev SDK
- Job payloads must be serializable (no class instances)

### Neutral

- Supabase Cron still used for simple DB maintenance tasks
- Worker deployed separately from web app (different CI pipeline step)

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Supabase Cron only | 60-second Edge Function limit kills research and crawl jobs |
| BullMQ + Redis | Must manage Redis infrastructure; Trigger.dev is managed |
| Inngest | Comparable to Trigger.dev; Trigger.dev has better DX for our stack |
| Temporal.io | Enterprise-grade workflow engine; over-engineered for v1 |
| Vercel Cron + API routes | 60-second serverless limit; same problem as Supabase Cron |
| AWS Step Functions | Cloud vendor lock-in; complex setup |

## Recommendation Summary

**Use Trigger.dev.** The job workload (long-running AI pipelines, browser automation, email orchestration) fundamentally requires capabilities that Supabase Cron and Edge Functions cannot provide. Supabase Cron remains useful for trivial database maintenance tasks only.
