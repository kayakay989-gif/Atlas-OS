# Folder Structure Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Overview

Atlas Sales OS uses a **Turborepo monorepo** to share types, validation schemas, and business logic between the web app, background jobs, and Supabase edge functions—while keeping deployment targets independent.

This document describes the **planned** structure. Directories are created incrementally as each milestone requires them. Do not scaffold the entire tree upfront.

---

## Repository Root

```
Atlas-Sales-OS/
├── .github/                    # GitHub Actions workflows, PR templates
├── apps/
│   ├── web/                    # Next.js web application
│   └── worker/                 # Trigger.dev worker application
├── packages/
│   ├── ui/                     # Shared shadcn/ui components
│   ├── db/                     # Database types, queries, migrations helpers
│   ├── shared/                 # Shared types, constants, utilities
│   ├── validation/             # Zod schemas (shared across app and worker)
│   ├── jobs/                   # Job abstraction over Trigger.dev (@atlas/jobs)
│   ├── events/                 # Domain event definitions and handlers
│   ├── providers/              # Pluggable discovery/enrichment providers (M2)
│   ├── ai/                     # AI gateway, memory, prompt registry (M2+)
│   └── email/                  # Email adapters, deliverability (M4)
├── supabase/
│   ├── migrations/             # SQL migrations (source of truth for schema)
│   ├── functions/              # Supabase Edge Functions
│   ├── seed.sql                # Development seed data
│   └── config.toml             # Supabase project configuration
├── docs/                       # Project documentation (this folder)
├── prompts/                    # AI prompt templates and registry
├── scripts/                    # Dev tooling scripts (seed, migrate, lint)
├── .env.example                # Environment variable template
├── .gitignore
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspace definition
├── turbo.json                  # Turborepo pipeline config
├── tsconfig.json               # Root TypeScript config
└── README.md
```

---

## `apps/web/` — Next.js Web Application

```
apps/web/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login, signup, reset)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/            # Authenticated routes
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard home
│   │   ├── campaigns/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── deliverability/
│   │   ├── settings/
│   │   └── analytics/
│   ├── api/                    # API routes (minimal; prefer Supabase/Edge Functions)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Re-exports from packages/ui (or local overrides)
│   └── features/               # Feature-specific components
│       ├── campaigns/
│       ├── companies/
│       ├── deliverability/
│       └── settings/
├── hooks/                      # Custom React hooks
├── lib/
│   ├── supabase/               # Supabase client (browser + server)
│   ├── auth/                   # Auth helpers
│   └── utils/                  # App-specific utilities
├── stores/                     # Zustand stores
├── public/                     # Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Conventions

- **Route groups** `(auth)` and `(dashboard)` separate layout concerns.
- **Feature components** live under `components/features/{context}/` matching bounded contexts.
- **No business logic in components** — use hooks and server actions/services.
- **Server Components by default** — Client Components only when interactivity requires it.

---

## `apps/worker/` — Trigger.dev Worker

```
apps/worker/
├── src/
│   ├── jobs/                   # Trigger.dev job definitions
│   │   ├── discovery/
│   │   ├── research/
│   │   ├── qualification/
│   │   ├── outreach/
│   │   ├── campaign/
│   │   ├── inbox/
│   │   └── analytics/
│   ├── handlers/               # Event handlers (consume domain events)
│   ├── lib/                    # Worker-specific utilities
│   └── index.ts                # Worker entry point
├── trigger.config.ts
├── tsconfig.json
└── package.json
```

### Conventions

- One file per job; job name matches event or schedule it handles.
- Jobs import shared logic from `packages/`, never duplicate.
- Every job validates `organizationId` from job payload before any DB access.

---

## `packages/` — Shared Packages

### `packages/shared/`

```
packages/shared/
├── src/
│   ├── constants/              # App-wide constants (roles, statuses, limits)
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Pure utility functions
├── tsconfig.json
└── package.json
```

### `packages/types/`

```
packages/types/
├── src/
│   ├── auth.ts                 # Auth-related schemas
│   ├── campaign.ts
│   ├── company.ts
│   ├── contact.ts
│   ├── email.ts
│   ├── jobs.ts                   # Job payload schemas
│   └── index.ts                # Barrel export
├── tsconfig.json
└── package.json
```

All API inputs, form data, and AI outputs validate through these schemas.

### `packages/database/`

```
packages/database/
├── src/
│   ├── client.ts               # Typed Supabase client factory
│   ├── queries/                # Reusable query functions by context
│   │   ├── campaigns.ts
│   │   ├── companies.ts
│   │   └── ...
│   └── types.ts                # Generated DB types (supabase gen types)
├── tsconfig.json
└── package.json
```

### `packages/config/`, `packages/utils/`, `packages/ui/`, `packages/providers/`

See [packages/README.md](../../packages/README.md) for the canonical M0 package layout and dependency rules.

### `packages/ai/` (future — use `@atlas/providers` interfaces)

```
packages/ai/
├── src/
│   ├── gateway.ts              # Provider routing, retry, cost tracking
│   ├── providers/
│   │   ├── openai.ts
│   │   └── gemini.ts
│   ├── prompts/                # Prompt builder functions (not raw strings)
│   └── schemas/                # Zod schemas for AI output validation
├── tsconfig.json
└── package.json
```

### `packages/email/`

```
packages/email/
├── src/
│   ├── adapters/
│   │   ├── google-workspace.ts
│   │   ├── smtp.ts
│   │   └── resend.ts
│   ├── deliverability/         # Suppression, bounce handling, health scoring
│   ├── templates/              # Email template rendering
│   └── types.ts
├── tsconfig.json
└── package.json
```

### `packages/events/`

```
packages/events/
├── src/
│   ├── catalog.ts              # Event type definitions
│   ├── emitter.ts              # Event emission (outbox write)
│   └── handlers/               # Shared handler logic (called by worker)
├── tsconfig.json
└── package.json
```

### `packages/ui/`

```
packages/ui/
├── src/
│   ├── components/             # shadcn/ui components
│   └── lib/
│       └── utils.ts            # cn() and shared UI utilities
├── tsconfig.json
└── package.json
```

---

## `supabase/` — Database & Edge Functions

```
supabase/
├── migrations/
│   ├── 00000000000000_init.sql
│   ├── 00000000000001_auth_and_orgs.sql
│   └── ...                     # One migration per logical change
├── functions/
│   └── _shared/                # Shared edge function utilities
├── seed.sql
└── config.toml
```

### Migration Conventions

- Timestamp-prefixed filenames: `YYYYMMDDHHMMSS_description.sql`
- One concern per migration (not one per milestone)
- Always include RLS policies in the same migration as table creation
- Never edit a migration that has been applied to staging/production

---

## `prompts/` — AI Prompt Registry

```
prompts/
├── README.md                   # Prompt engineering guidelines
├── research/
│   ├── company-analysis.v1.md
│   └── ux-review.v1.md
├── outreach/
│   ├── cold-email.v1.md
│   └── follow-up.v1.md
├── qualification/
│   └── lead-scoring.v1.md
└── conversion/
    ├── proposal.v1.md
    └── meeting-brief.v1.md
```

Prompts are versioned files, loaded by `packages/ai`. See [prompts/README.md](../../prompts/README.md).

---

## `docs/` — Documentation

Current structure. See [docs/README.md](../README.md).

---

## `.github/` — CI/CD & Templates

```
.github/
├── workflows/
│   ├── ci.yml                  # Lint, typecheck, test on PR
│   ├── deploy-preview.yml      # Vercel preview on PR
│   └── deploy-production.yml   # Production deploy on main
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/
    ├── bug_report.md
    └── feature_request.md
```

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `CampaignList.tsx` |
| Files (utilities) | kebab-case | `format-date.ts` |
| Files (jobs) | kebab-case | `research-company.ts` |
| Database tables | snake_case, plural | `campaign_contacts` |
| Database columns | snake_case | `organization_id` |
| TypeScript types | PascalCase | `CampaignContact` |
| Zod schemas | camelCase + Schema suffix | `campaignContactSchema` |
| Environment variables | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY` |
| Event names | dot.notation | `company.discovered` |
| API routes | kebab-case | `/api/campaign-contacts` |

---

## What NOT to Create Yet

Per our milestone-driven approach, do **not** scaffold these until their milestone begins:

| Directory | Created In |
|-----------|------------|
| `apps/web/app/(dashboard)/campaigns/` | M5 |
| `apps/web/components/features/deliverability/` | M4 |
| `packages/email/` | M4 |
| `apps/worker/src/jobs/discovery/` | M2 |
| `prompts/outreach/` | M3 |

---

## Related Documents

- [Architecture Overview](./overview.md)
- [ADR-0003: Monorepo Structure](./adrs/0003-monorepo-structure.md)
- [Milestone Plan](../milestones/milestone-plan.md)
- [Coding Standards](../development/coding-standards.md)
