# ADR-0001: Tech Stack Selection

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect, Product Owner

## Context

Atlas Sales OS requires a modern, production-grade stack that supports:

- A rich web dashboard for operators
- Real-time and async processing for AI workflows
- Multi-tenant data isolation
- Email campaign execution at scale
- Rapid iteration with strong type safety

The stack must be maintainable by a small team, have strong ecosystem support, and deploy reliably to production.

## Decision

Adopt the following approved tech stack:

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend framework | Next.js (App Router) | SSR/SSG, API routes, Vercel-native deployment |
| UI library | React 19+ | Ecosystem, component model |
| Language | TypeScript (strict) | Type safety across monorepo |
| Styling | Tailwind CSS | Utility-first, consistent design system |
| Component library | shadcn/ui | Accessible, customizable, no vendor lock-in |
| Backend platform | Supabase | PostgreSQL, Auth, Edge Functions, Storage, RLS |
| Database | PostgreSQL (via Supabase) | Relational model fits domain; RLS for multi-tenancy |
| Authentication | Supabase Auth | Integrated with RLS; extensible to SSO |
| Hosting | Vercel | Next.js-native; preview deployments |
| AI providers | OpenAI + Gemini | Best-in-class models; redundancy via abstraction |
| Browser automation | Playwright | Reliable headless browsing for dynamic sites |
| Web extraction | Firecrawl | Structured extraction for static/semi-static sites |
| Job orchestration | Trigger.dev | Long-running jobs, retries, observability (see ADR-0007) |
| Transactional email | Resend | Developer-friendly API for system emails |
| Outreach email | Google Workspace + SMTP | Full mailbox control for outbound |
| Validation | Zod | Runtime validation shared across client/server/worker |
| Client state | Zustand | Lightweight; avoids Redux complexity |
| Forms | React Hook Form | Performance, minimal re-renders |
| Monorepo | Turborepo + pnpm | Shared packages, incremental builds |
| Testing | Vitest + Playwright | Unit/integration + E2E |

## Consequences

### Positive

- Single language (TypeScript) across frontend, backend, and workers
- Supabase RLS provides database-level tenant isolation
- Vercel + Supabase + Trigger.dev all have generous free tiers for development
- Strong community and documentation for all chosen tools
- shadcn/ui avoids component library upgrade lock-in

### Negative

- Supabase Edge Functions have cold start latency and runtime limits
- Trigger.dev adds a third hosted service to manage
- Google Workspace API integration requires OAuth setup complexity
- Multi-provider AI adds abstraction overhead

### Neutral

- Team must learn Supabase RLS patterns
- pnpm required (not npm/yarn) for workspace management

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Remix instead of Next.js | Next.js has stronger Vercel integration and larger ecosystem for our use case |
| Prisma + standalone Postgres | Supabase provides Auth, RLS, Storage, and Edge Functions in one platform |
| tRPC | Supabase client + Edge Functions sufficient; tRPC adds complexity without clear benefit at this stage |
| Redux for state | Overkill for our UI complexity; Zustand is simpler |
| BullMQ + Redis for jobs | Requires managing Redis infrastructure; Trigger.dev is managed |
| Single AI provider (OpenAI only) | Vendor risk; Gemini provides fallback and cost optimization |
| Custom UI component library | shadcn/ui is faster to ship and fully customizable |
