# Project State — Atlas Sales OS

**Last Updated:** 2026-07-20  
**Updated By:** Lead Architect (M3 Complete — pending staging)

> **Rule:** Read this file before starting any task. Update it after every milestone completion.

---

## Current Milestone

**M6 — Meeting Booking** ✅ **Complete** (staging verification pending)

**Next Milestone:** M7 — Proposals & Invoicing

---

## M6 Phase Progress

| Phase | Name                                              | Status      |
| ----- | ------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                             | ✅ Complete |
| 2     | Types & `@atlas/meetings` Package                 | ✅ Complete |
| 3     | Public Booking RPC, Brief Generation & Worker Job | ✅ Complete |
| 4     | Web UI (Settings, Dashboard, Public Booking Page) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                    | ✅ Complete |

Full plan: [docs/milestones/m6-implementation-plan.md](./docs/milestones/m6-implementation-plan.md)

---

## M6 Deliverables (Verified)

- [x] Supabase migration: `calendar_connections`, `availability_settings`, `booking_links`, `meetings`, `meeting_briefs`, public RPCs, RLS, audit
- [x] `@atlas/meetings` — availability slots, booking links, public book flow, mock brief generation
- [x] Worker job: `meeting-brief-generate`
- [x] UI: `/meetings`, `/meetings/[id]`, `/settings/meetings`, public `/book/[token]`
- [x] Feature flag: `FF_MEETING_BOOKING=true`
- [x] Unit tests for slot generation, brief content, booking schemas
- [x] `pnpm validate` passes
- [ ] Real Google Calendar OAuth
- [ ] Deployed to staging and manually verified

---

## M5 Phase Progress

| Phase | Name                                               | Status      |
| ----- | -------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                              | ✅ Complete |
| 2     | Types & `@atlas/campaigns` Package                 | ✅ Complete |
| 3     | Send Scheduler, Pre-Send Integration & Worker Jobs | ✅ Complete |
| 4     | Web UI (Campaign Builder, Dashboard, Analytics)    | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                     | ✅ Complete |

Full plan: [docs/milestones/m5-implementation-plan.md](./docs/milestones/m5-implementation-plan.md)

---

## M5 Deliverables (Verified)

- [x] Supabase migration: `campaigns`, `campaign_mailboxes`, `campaign_contacts`, `send_records`, `inbound_messages`, RLS, audit
- [x] `@atlas/campaigns` — create/launch/pause, mailbox rotation, send scheduler, mock send with pre-send checks
- [x] Reply classifier, bounce/unsubscribe handlers, campaign auto-pause on low mailbox health
- [x] Worker job: `campaign-send`
- [x] UI: `/campaigns`, `/campaigns/new`, `/campaigns/[id]`
- [x] Feature flags: `FF_CAMPAIGN_EXECUTION=true` + `FF_EMAIL_SENDING=true`
- [x] Unit tests for rotation, reply classification, send window
- [x] `pnpm validate` passes
- [ ] Real email dispatch and inbox polling
- [ ] Deployed to staging and manually verified

---

## M4 Phase Progress

| Phase | Name                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                               | ✅ Complete |
| 2     | Types & `@atlas/deliverability` Package             | ✅ Complete |
| 3     | DNS Validation, Warm-Up & Worker Jobs               | ✅ Complete |
| 4     | Web UI (Domains, Mailboxes, Suppression, Dashboard) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                      | ✅ Complete |

Full plan: [docs/milestones/m4-implementation-plan.md](./docs/milestones/m4-implementation-plan.md)

---

## M4 Deliverables (Verified)

- [x] Supabase migration: `outreach_domains`, `mailboxes`, `suppression_entries`, RLS, audit
- [x] `@atlas/deliverability` — DNS validation, warm-up ramp, health scoring, pre-send checks (ADR-0006)
- [x] Worker job: `domain-dns-check`
- [x] UI: `/deliverability`, `/deliverability/domains`, `/deliverability/mailboxes`, `/deliverability/suppression`
- [x] Feature flag: `FF_EMAIL_SENDING=true` gates deliverability UI and actions
- [x] Unit tests for DNS parsing, warm-up, health score, all 8 pre-send rules
- [x] `pnpm validate` passes
- [ ] Real DNS in production worker (mock resolver in tests)
- [ ] Google Workspace OAuth for mailbox connect
- [ ] Deployed to staging and manually verified

---

## M3 Phase Progress

| Phase | Name                                        | Status      |
| ----- | ------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                       | ✅ Complete |
| 2     | Types, Qualification & Outreach Packages    | ✅ Complete |
| 3     | Pipeline Services & Worker Jobs             | ✅ Complete |
| 4     | Web UI (Qualification, Outreach, Sequences) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off              | ✅ Complete |

Full plan: [docs/milestones/m3-implementation-plan.md](./docs/milestones/m3-implementation-plan.md)

---

## M3 Deliverables (Verified)

- [x] Supabase migration: `lead_scores`, `email_sequences`, `sequence_steps`, `email_drafts`, `organization_outreach_settings`, RLS
- [x] `@atlas/qualification` — deterministic lead scoring after research
- [x] `@atlas/outreach` — email generation, quality checks, default 3-step sequence
- [x] Post-research pipeline chains qualification → outreach when `FF_OUTREACH_GENERATION=true`
- [x] Worker jobs: `lead-qualification`, `outreach-generation`, `post-research-pipeline`
- [x] UI: `/qualification`, `/outreach`, `/outreach/[id]`, `/sequences`, `/settings/outreach`
- [x] Approval workflow: review, edit, approve/reject drafts
- [x] Outreach settings: min score threshold, manual approval toggle
- [x] Unit tests for scoring, quality checks, sequence/email schemas
- [x] `pnpm validate` passes
- [ ] Real OpenAI email generation (mock used for M3)
- [ ] E2E tests for qualification → outreach flow
- [ ] Deployed to staging and manually verified

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

| Package                 | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `@atlas/config`         | Env validation, feature flags, ESLint/Prettier/Tailwind/Vitest presets |
| `@atlas/database`       | Supabase client factory + typed schema                                 |
| `@atlas/discovery`      | CSV discovery, crawl, research pipeline orchestration                  |
| `@atlas/qualification`  | Lead scoring after research                                            |
| `@atlas/deliverability` | DNS validation, warm-up, health scoring, pre-send checks               |
| `@atlas/campaigns`      | Campaign builder, send scheduler, mock dispatch, reply handling        |
| `@atlas/outreach`       | Email generation, sequences, quality checks, draft management          |
| `@atlas/events`         | Domain event catalog                                                   |
| `@atlas/jobs`           | Job abstraction (Trigger.dev isolated in worker)                       |
| `@atlas/providers`      | Pluggable provider interfaces                                          |
| `@atlas/shared`         | Errors, constants, structured logger, RBAC helpers                     |
| `@atlas/types`          | Zod schemas + shared types (auth, discovery, qualification, outreach)  |
| `@atlas/ui`             | shadcn/ui components + design tokens                                   |
| `@atlas/utils`          | Pure utilities (`cn`, `safeJsonParse`, `assertNever`)                  |

---

## Validation

```bash
pnpm validate          # lint + typecheck + test + build
pnpm supabase:start    # Local Supabase for auth testing
pnpm db:reset          # Apply migrations
pnpm dev               # Start web app on :3000
pnpm test:e2e          # Playwright (requires built web app)
```

Set `FF_MEETING_BOOKING=true` (plus prior pipeline flags as needed) in `.env.local`.

Last validated: **2026-07-20** — all green (M6).

---

## Known Issues

| Issue                                                | Severity | Notes                         |
| ---------------------------------------------------- | -------- | ----------------------------- |
| RLS integration tests not in CI yet                  | Low      | Run locally with Supabase CLI |
| Research/email uses mock providers (not OpenAI)      | Low      | Wire real provider in M3+     |
| `next build` ESLint plugin warning                   | Low      | FlatCompat + monorepo         |
| Turbo warnings: database/worker build has no outputs | Low      | Typecheck-only build scripts  |
| Trigger.dev project ID placeholder                   | Low      | Set before worker dev         |

---

## Technical Debt

| Item                              | Resolve In                  |
| --------------------------------- | --------------------------- |
| RLS integration test suite in CI  | M1 follow-up                |
| OpenAI research + email providers | M3 follow-up                |
| Firecrawl / Playwright providers  | M2+                         |
| Per-org feature flags UI          | M2+ (schema ready)          |
| Native Next.js flat ESLint config | When Next.js docs stabilize |

---

## Next Step

1. Run locally: `pnpm supabase:start && pnpm db:reset && pnpm dev`
2. Enable `FF_MEETING_BOOKING=true` and configure `/settings/meetings`
3. Create a booking link → share `/book/[token]` → view meeting + brief at `/meetings`
4. Begin **M7 — Proposals & Invoicing** when approved

---

## Philosophy (Quick Reference)

1. Product first · 2. AI-first · 3. Own the stack · 4. Multi-tenant always
2. Event-driven · 6. Vendor abstraction · 7. Deliverability as product
3. Pluggable providers · 9. Agent memory · 10. Quality over speed
4. **PROJECT_STATE is source of truth** · 12. **ADR for major changes**
