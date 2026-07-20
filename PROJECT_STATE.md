# Project State — Atlas Sales OS

**Last Updated:** 2026-07-20  
**Updated By:** Lead Architect (M1 Complete — pending staging)

> **Rule:** Read this file before starting any task. Update it after every milestone completion.

---

## Current Milestone

**M1 — Auth & Multi-Tenancy** ✅ **Complete** (staging verification pending)

**Next Milestone:** M2 — Discovery & Research Pipeline (awaiting approval to start)

---

## M1 Phase Progress

| Phase | Name                                      | Status      |
| ----- | ----------------------------------------- | ----------- |
| 1     | Database Schema, RLS & Audit Triggers     | ✅ Complete |
| 2     | Types, Auth Constants & UI Primitives     | ✅ Complete |
| 3     | Supabase SSR, Middleware & Auth Pages     | ✅ Complete |
| 4     | Dashboard Shell, Onboarding & Org Context | ✅ Complete |
| 5     | Settings, Team Management & Invitations   | ✅ Complete |
| 6     | RBAC Helpers, Tests & Validation          | ✅ Complete |

Full plan: [docs/milestones/m1-implementation-plan.md](./docs/milestones/m1-implementation-plan.md)

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
| `@atlas/events`    | Domain event catalog                                                   |
| `@atlas/jobs`      | Job abstraction (Trigger.dev isolated in worker)                       |
| `@atlas/providers` | Pluggable provider interfaces                                          |
| `@atlas/shared`    | Errors, constants, structured logger, RBAC helpers                     |
| `@atlas/types`     | Zod schemas + shared types (auth, jobs)                                |
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

Last validated: **2026-07-20** — all green.

---

## Known Issues

| Issue                                                | Severity | Notes                         |
| ---------------------------------------------------- | -------- | ----------------------------- |
| RLS integration tests not in CI yet                  | Low      | Run locally with Supabase CLI |
| `next build` ESLint plugin warning                   | Low      | FlatCompat + monorepo         |
| Turbo warnings: database/worker build has no outputs | Low      | Typecheck-only build scripts  |
| Trigger.dev project ID placeholder                   | Low      | Set before worker dev         |

---

## Technical Debt

| Item                              | Resolve In                  |
| --------------------------------- | --------------------------- |
| RLS integration test suite in CI  | M1 follow-up                |
| Per-org feature flags UI          | M2+ (schema ready)          |
| Native Next.js flat ESLint config | When Next.js docs stabilize |

---

## Next Step

1. Run locally: `pnpm supabase:start && pnpm db:reset && pnpm dev`
2. Sign up → create org → invite teammate → accept invite
3. Connect Vercel + Supabase staging for deployment verification
4. Approve **M2 — Discovery & Research Pipeline** to begin

---

## Philosophy (Quick Reference)

1. Product first · 2. AI-first · 3. Own the stack · 4. Multi-tenant always
2. Event-driven · 6. Vendor abstraction · 7. Deliverability as product
3. Pluggable providers · 9. Agent memory · 10. Quality over speed
4. **PROJECT_STATE is source of truth** · 12. **ADR for major changes**
