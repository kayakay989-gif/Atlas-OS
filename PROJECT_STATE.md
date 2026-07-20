# Project State — Atlas Sales OS

**Last Updated:** 2026-07-20  
**Updated By:** Lead Architect (M2 Complete — pending staging)

> **Rule:** Read this file before starting any task. Update it after every milestone completion.

---

## Current Milestone

**M2 — Discovery & Research Pipeline** ✅ **Complete** (staging verification pending)

**Next Milestone:** M3 — Qualification & Scoring (awaiting approval to start)

---

## M2 Phase Progress

| Phase | Name                               | Status      |
| ----- | ---------------------------------- | ----------- |
| 1     | Database Schema & RLS              | ✅ Complete |
| 2     | Types & `@atlas/discovery` Package | ✅ Complete |
| 3     | Pipeline Services & Worker Jobs    | ✅ Complete |
| 4     | Web UI (ICP, Companies, Profiles)  | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off     | ✅ Complete |

Full plan: [docs/milestones/m2-implementation-plan.md](./docs/milestones/m2-implementation-plan.md)

---

## M2 Deliverables (Verified)

- [x] Supabase migration: `icp_profiles`, `companies`, `company_crawls`, `research_reports`, `contacts`, `pipeline_jobs`, RLS
- [x] `@atlas/discovery` package: CSV provider, crawl service, mock research, pipeline orchestration
- [x] Discovery types and Zod schemas in `@atlas/types`
- [x] Worker jobs for CSV discovery and company pipeline (`apps/worker`)
- [x] Web server actions with async pipeline via `after()`
- [x] UI: `/discovery`, ICP create/detail, CSV import, `/companies`, company profile
- [x] Feature flag: `FF_DISCOVERY_PIPELINE=true`
- [x] Unit tests for discovery types, CSV parsing, research schema
- [x] `pnpm validate` passes
- [ ] Real OpenAI research provider (mock used for M2)
- [ ] E2E tests for discovery flow
- [ ] Deployed to staging and manually verified

---

## M1 Deliverables (Verified)

- [x] Supabase migration: profiles, organizations, memberships, invitations, audit_logs, RLS
- [x] Auth pages: login, signup, sign out, auth callback
- [x] Organization onboarding flow
- [x] Dashboard shell with sidebar navigation
- [x] Organization settings and team management
- [x] Invitation create, revoke, and accept (`/invite/[token]`)
- [x] Audit log triggers for org, membership, and invitation changes
- [x] RBAC helpers (`canManageMembers`, `canDeleteOrganization`)
- [x] Unit tests for auth schemas and RBAC
- [x] Playwright auth shell e2e tests
- [x] `pnpm validate` passes
- [ ] RLS integration tests in CI (requires local Supabase in dev)
- [ ] Deployed to staging and manually verified

---

## M0 Deliverables (Verified)

- [x] Turborepo monorepo with pnpm workspaces
- [x] `apps/web` — Next.js 15 shell + `/health`
- [x] `apps/worker` — Trigger.dev behind `@atlas/jobs`
- [x] Packages: `config`, `database`, `events`, `jobs`, `providers`, `shared`, `types`, `ui`, `utils`
- [x] TypeScript strict, ESLint, Prettier, Husky, lint-staged, commitlint
- [x] Vitest + RTL + Playwright infrastructure
- [x] Structured logging + error handling
- [x] Env validation + feature flags (ADR-0012)
- [x] Provider interfaces (ADR-0011)
- [x] CI with dependency audit + Gitleaks
- [x] Vercel config + security headers
- [x] Bootstrap scripts (`scripts/bootstrap.ps1`, `scripts/bootstrap.sh`)

---

## Package Layout

| Package            | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `@atlas/config`    | Env validation, feature flags, ESLint/Prettier/Tailwind/Vitest presets |
| `@atlas/database`  | Supabase client factory + typed schema                                 |
| `@atlas/discovery` | CSV discovery, crawl, research pipeline orchestration                  |
| `@atlas/events`    | Domain event catalog                                                   |
| `@atlas/jobs`      | Job abstraction (Trigger.dev isolated in worker)                       |
| `@atlas/providers` | Pluggable provider interfaces                                          |
| `@atlas/shared`    | Errors, constants, structured logger, RBAC helpers                     |
| `@atlas/types`     | Zod schemas + shared types (auth, discovery, jobs)                     |
| `@atlas/ui`        | shadcn/ui components + design tokens                                   |
| `@atlas/utils`     | Pure utilities (`cn`, `safeJsonParse`, `assertNever`)                  |

---

## Validation

```bash
pnpm validate          # lint + typecheck + test + build
pnpm supabase:start    # Local Supabase for auth testing
pnpm db:reset          # Apply migrations
pnpm dev               # Start web app on :3000
pnpm test:e2e          # Playwright (requires built web app)
```

Set `FF_DISCOVERY_PIPELINE=true` in `.env.local` to enable discovery routes.

Last validated: **2026-07-20** — all green.

---

## Known Issues

| Issue                                                | Severity | Notes                         |
| ---------------------------------------------------- | -------- | ----------------------------- |
| RLS integration tests not in CI yet                  | Low      | Run locally with Supabase CLI |
| Research uses mock provider (not OpenAI)             | Low      | Wire real provider in M2+     |
| `next build` ESLint plugin warning                   | Low      | FlatCompat + monorepo         |
| Turbo warnings: database/worker build has no outputs | Low      | Typecheck-only build scripts  |
| Trigger.dev project ID placeholder                   | Low      | Set before worker dev         |

---

## Technical Debt

| Item                              | Resolve In                  |
| --------------------------------- | --------------------------- |
| RLS integration test suite in CI  | M1 follow-up                |
| OpenAI research provider          | M2 follow-up                |
| Firecrawl / Playwright providers  | M2+                         |
| Per-org feature flags UI          | M2+ (schema ready)          |
| Native Next.js flat ESLint config | When Next.js docs stabilize |

---

## Next Step

1. Run locally: `pnpm supabase:start && pnpm db:reset && pnpm dev`
2. Set `FF_DISCOVERY_PIPELINE=true`, sign in, create ICP → import CSV → view company research
3. Connect Vercel + Supabase staging for deployment verification
4. Approve **M3 — Qualification & Scoring** to begin

---

## Philosophy (Quick Reference)

1. Product first · 2. AI-first · 3. Own the stack · 4. Multi-tenant always
2. Event-driven · 6. Vendor abstraction · 7. Deliverability as product
3. Pluggable providers · 9. Agent memory · 10. Quality over speed
4. **PROJECT_STATE is source of truth** · 12. **ADR for major changes**
