# M0 Implementation Plan — Atlas Sales OS

**Version:** 1.1  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 0 (Project Foundation). Each phase is independently reviewable, leaves the repo in a working state, and requires approval before the next phase begins.

**Source of truth for progress:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Scope

**In:** Engineering infrastructure only — monorepo, packages, tooling, CI, deployment config, observability/logging scaffold, feature flag scaffold.

**Out:** Auth, CRM, AI agents, email campaigns, crawling, outreach, business database schema.

---

## Architectural Amendments (Approved 2026-07-20)

| # | Amendment | Addressed In |
|---|-----------|--------------|
| 1 | Own the stack; document dependencies | [dependencies.md](../architecture/dependencies.md), ADR-0008 |
| 2 | Provider/plugin architecture | ADR-0011, Phase 2+ (`packages/providers/`) |
| 3 | Feature flags infrastructure | ADR-0012, Phase 5 (`@atlas/config`) |
| 4 | Structured event-aligned logging | ADR-0013, Phase 10 (`@atlas/shared`) |
| 5 | Performance budgets | ADR-0014, Phase 11 |
| 6 | Security scanning in CI | Phase 13 |
| 7 | Package READMEs | Phase 2+ (each package) |
| 8 | PROJECT_STATE.md governance | All phases |
| 9 | One phase = one commit; wait for approval | All phases |
| 10 | ADR enforcement for major changes | [adrs/README.md](../architecture/adrs/README.md) |

---

## Target Package Layout

| Package | Purpose |
|---------|---------|
| `@atlas/shared` | Errors, constants, structured logger |
| `@atlas/config` | Env validation, feature flags, shared tooling config |
| `@atlas/types` | TypeScript types + Zod schemas |
| `@atlas/utils` | Pure utilities |
| `@atlas/ui` | shadcn/ui components |
| `@atlas/database` | Supabase client factory, DB types |
| `@atlas/events` | Domain event catalog |
| `@atlas/jobs` | Job abstraction (Trigger.dev adapter in worker) |
| `packages/providers/*` | AI, email, search, discovery, storage, analytics adapters |

---

## Phase Tracker

| Phase | Name | Status |
|-------|------|--------|
| 1 | Monorepo Governance & Workspace Foundation | **Complete** |
| 2 | Package Architecture & Dependency Boundaries | **Complete** |
| 3 | TypeScript Strict Foundation | **Complete** |
| 4 | ESLint & Prettier | **Complete** |
| 5 | Core Infrastructure Packages | **Complete** |
| 6 | apps/web Shell | **Complete** |
| 7 | Tailwind & shadcn/ui (@atlas/ui) | **Complete** |
| 8 | Supabase Local Configuration | **Complete** |
| 9 | Worker & Job Abstraction | **Complete** |
| 10 | Logging & Error Handling | **Complete** |
| 11 | Testing Infrastructure (Vitest, RTL, Playwright) | **Complete** |
| 12 | Git Hooks & Commit Conventions | **Complete** |
| 13 | GitHub Actions CI (+ security scanning) | **Complete** |
| 14 | Vercel Deployment Configuration | **Complete** |
| 15 | Local Dev Bootstrap & M0 Sign-Off | **Complete** |

See the full phase specifications in the project chat archive (2026-07-20) or request expansion of any phase before starting it.

---

## Phase Completion Protocol

After every phase:

1. Run `pnpm validate`
2. Update `PROJECT_STATE.md`
3. Summarize: files created/modified, why, validation results
4. Provide recommended Conventional Commit message
5. **Stop — wait for approval**

---

## Related Documents

- [Milestone Plan](./milestone-plan.md)
- [Development Workflow](../development/workflow.md)
- [ADRs](../architecture/adrs/README.md)
- [Dependency Evaluation](../architecture/dependencies.md)
