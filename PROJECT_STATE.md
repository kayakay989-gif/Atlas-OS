# Project State — Atlas Sales OS

**Last Updated:** 2026-07-20  
**Updated By:** Lead Architect (M0 Complete)

> **Rule:** Read this file before starting any task. Update it after every milestone completion.

---

## Current Milestone

**M0 — Project Foundation** ✅ **Complete**

**Next Milestone:** M1 — Auth & Multi-Tenancy (awaiting approval to start)

---

## M0 Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Monorepo Governance & Workspace Foundation | ✅ Complete |
| 2 | Package Architecture & Dependency Boundaries | ✅ Complete |
| 3 | TypeScript Strict Foundation | ✅ Complete |
| 4 | ESLint & Prettier | ✅ Complete |
| 5 | Core Infrastructure Packages | ✅ Complete |
| 6 | apps/web Shell | ✅ Complete |
| 7 | Tailwind & shadcn/ui (@atlas/ui) | ✅ Complete |
| 8 | Supabase Local Configuration | ✅ Complete |
| 9 | Worker & Job Abstraction | ✅ Complete |
| 10 | Logging & Error Handling | ✅ Complete |
| 11 | Testing Infrastructure | ✅ Complete |
| 12 | Git Hooks & Commit Conventions | ✅ Complete |
| 13 | GitHub Actions CI + Security Scanning | ✅ Complete |
| 14 | Vercel Deployment Configuration | ✅ Complete |
| 15 | Local Dev Bootstrap & M0 Sign-Off | ✅ Complete |

Full plan: [docs/milestones/m0-implementation-plan.md](./docs/milestones/m0-implementation-plan.md)

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
- [x] `pnpm validate` passes (lint, typecheck, test, build)

**No business features** — auth, CRM, AI agents, email, crawling, outreach are M1+.

---

## Package Layout

| Package | Purpose |
|---------|---------|
| `@atlas/config` | Env validation, feature flags, ESLint/Prettier/Tailwind/Vitest presets |
| `@atlas/database` | Supabase client factory + generated types |
| `@atlas/events` | Domain event catalog |
| `@atlas/jobs` | Job abstraction (Trigger.dev isolated in worker) |
| `@atlas/providers` | Pluggable provider interfaces |
| `@atlas/shared` | Errors, constants, structured logger |
| `@atlas/types` | Zod schemas + shared types |
| `@atlas/ui` | shadcn/ui components + design tokens |
| `@atlas/utils` | Pure utilities (`cn`, `safeJsonParse`, `assertNever`) |

---

## Validation

```bash
pnpm validate          # lint + typecheck + test + build
pnpm test:e2e          # Playwright (requires built web app)
./scripts/bootstrap.ps1   # Windows onboarding
./scripts/bootstrap.sh    # Unix onboarding
```

Last validated: **2026-07-20** — all green.

---

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| `next build` ESLint plugin warning | Low | FlatCompat + monorepo; turbo lint uses Next rules |
| Turbo warnings: database/worker build has no outputs | Low | Typecheck-only build scripts |
| Husky requires git init | Low | `prepare` warns if not a git repo |
| Trigger.dev project ID placeholder | Low | Set in dashboard before worker dev |
| Gitleaks in CI needs git history | Low | Works on GitHub; local CI mirror may differ |

---

## Technical Debt

| Item | Resolve In |
|------|------------|
| Per-org feature flags from database | M1 |
| Supabase business schema | M1 |
| Replace console logger backend if volume grows | M2+ |
| Native Next.js flat ESLint config | When Next.js docs stabilize |

---

## Next Step

**M1 — Auth & Multi-Tenancy** — organizations, users, RLS, Supabase auth integration.

Do not start M1 until explicitly approved.

---

## Philosophy (Quick Reference)

1. Product first · 2. AI-first · 3. Own the stack · 4. Multi-tenant always  
5. Event-driven · 6. Vendor abstraction · 7. Deliverability as product  
8. Pluggable providers · 9. Agent memory · 10. Quality over speed  
11. **PROJECT_STATE is source of truth** · 12. **ADR for major changes**
