# Milestone Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Overview

Atlas Sales OS is delivered in **10 milestones (M0–M9)**. Each milestone produces a working, deployable increment. No milestone begins until the prior milestone's acceptance criteria are met and approved.

Milestones are **sequential with defined parallel paths** where dependencies allow.

---

## Milestone Summary

| Milestone | Name | Depends On | Key Deliverable |
|-----------|------|------------|-----------------|
| **M0** | Project Foundation | — | Monorepo, CI/CD, tooling, deployment pipeline |
| **M1** | Auth & Tenancy | M0 | Login, orgs, RBAC, core data model, dashboard shell |
| **M2** | Discovery & Research | M1 | ICP config, company discovery, website crawl, AI research |
| **M3** | Qualification & Outreach | M2 | Lead scoring, email generation, sequences, approval workflows |
| **M4** | Email Infrastructure | M1 | Domains, mailboxes, DNS, warm-up, suppression, deliverability |
| **M5** | Campaigns & Replies | M3, M4 | Campaign execution, send scheduling, reply detection, analytics |
| **M6** | Meeting Booking | M5 | Calendar integration, booking links, pre-meeting briefs |
| **M7** | Proposals & Invoicing | M5 | Proposal generation, approval, invoicing, onboarding |
| **M8** | Learning & Optimization | M5, M6, M7 | Analytics, A/B testing, ICP refinement, copy optimization |
| **M9** | Production Hardening | M8 | Security audit, monitoring, performance, commercial readiness |

### Dependency Graph

```
M0 → M1 ──┬──▶ M2 → M3 ──▶ M5 ──┬──▶ M6 ──▶ M8 → M9
           │                     │         │
           └──▶ M4 ──────────────┘         M7 ──▶ M8
```

**Note:** M4 (Email Infrastructure) can start in parallel with M2/M3 after M1 is complete, since it depends on auth/tenancy but not on discovery.

---

## M0 — Project Foundation

**Goal:** Establish the monorepo, tooling, CI/CD, and deployment pipeline so feature development can begin.

### Deliverables

| Item | Detail |
|------|--------|
| Turborepo monorepo | pnpm workspaces, turbo pipeline |
| Next.js app scaffold | App Router, Tailwind, shadcn/ui initialized |
| Trigger.dev worker scaffold | Worker app with example job |
| Supabase project | Local + staging projects configured |
| CI pipeline | Lint, typecheck, test on PR |
| Deployment pipeline | Vercel preview on PR, staging deploy |
| Tooling | ESLint, Prettier, TypeScript strict, Vitest |
| Environment template | `.env.example` with all required variables |
| GitHub config | Branch protection, PR template, issue templates |

### Acceptance Criteria

- [ ] `pnpm install && pnpm dev` starts web app locally
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] PR triggers CI checks and Vercel preview deployment
- [ ] Supabase local instance starts with `pnpm supabase:start`
- [ ] Trigger.dev worker connects and runs example job
- [ ] Documentation updated: environment-setup.md populated

### Out of Scope

- Authentication, database schema, UI features

---

## M1 — Auth & Tenancy

**Goal:** Users can sign up, create organizations, invite team members, and access a protected dashboard.

### Deliverables

| Item | Detail |
|------|--------|
| Supabase Auth | Email/password signup and login |
| Organization model | Create org, switch org, org settings |
| Membership & RBAC | Owner, admin, member roles |
| RLS policies | All tables scoped by `organization_id` |
| Core data model | Users, organizations, memberships, audit_logs |
| Dashboard shell | Sidebar navigation, empty states, settings page |
| Audit logging | Immutable log for all state-changing operations |
| Invitation flow | Invite team members via email |

### Acceptance Criteria

- [ ] User can sign up, log in, log out
- [ ] User can create an organization and see empty dashboard
- [ ] User can invite another user to their organization
- [ ] RLS prevents cross-tenant data access (verified by integration tests)
- [ ] All state changes logged in audit_logs
- [ ] Role-based access: member cannot delete org, admin can manage members
- [ ] Deployed to staging and verified

### Out of Scope

- SSO, company/contact/campaign entities, AI features

---

## M2 — Discovery & Research Pipeline

**Goal:** Users can define ICP criteria, discover matching companies, and view AI-generated research reports.

### Deliverables

| Item | Detail |
|------|--------|
| ICP configuration UI | Define target criteria (industry, size, geography, keywords) |
| Company discovery | Find companies via **pluggable providers** (CSV, Firecrawl, etc.—not coupled to Apollo) |
| Website crawling | Firecrawl + Playwright for public website extraction |
| AI research | Company analysis: branding, UX, positioning, pain points |
| Contact discovery | Find publicly available business contact information |
| Company profiles | Research dashboard with AI-generated insights |
| Discovery jobs | Trigger.dev jobs for async discovery and research |
| Event flow | `company.discovered` → `company.researched` events |

### Acceptance Criteria

- [ ] User can create an ICP profile with configurable criteria
- [ ] System discovers companies via at least one pluggable provider (CSV import minimum)
- [ ] Provider architecture allows adding new sources without changing business logic
- [ ] Website crawl extracts meaningful content from public pages
- [ ] AI generates research report with branding, UX, and positioning analysis
- [ ] Public business contacts found and associated with company
- [ ] Company profile page displays research and contacts
- [ ] Discovery and research run asynchronously with progress indicators
- [ ] All operations scoped to organization

### Out of Scope

- Lead scoring, email generation, campaign execution

---

## M3 — Qualification & Outreach Generation

**Goal:** Users can qualify discovered leads, generate personalized outreach, and configure email sequences.

### Deliverables

| Item | Detail |
|------|--------|
| Lead scoring | Configurable rules + AI scoring |
| Approval workflows | Human review gates (configurable per org) |
| Email generation | AI personalized outreach from research context |
| Sequence builder | Multi-step email sequences with timing |
| Template management | Base templates with AI personalization layer |
| Quality checks | Pre-send validation (spam triggers, missing fields) |
| Outreach review UI | Review, edit, approve/reject generated emails |

### Acceptance Criteria

- [ ] Leads scored automatically after research completes
- [ ] User can configure approval requirement (auto-send vs. manual review)
- [ ] AI generates personalized email using company research data
- [ ] User can review, edit, and approve/reject generated emails
- [ ] Sequences support 3+ steps with configurable delays
- [ ] Quality check flags emails missing required elements
- [ ] Approved emails ready for campaign (but not sent — M5)

### Out of Scope

- Actual email sending, deliverability infrastructure, reply detection

---

## M4 — Email Infrastructure

**Goal:** Users can configure outreach domains, mailboxes, and deliverability controls.

### Deliverables

| Item | Detail |
|------|--------|
| Domain management | Add outreach domains, DNS configuration guidance |
| DNS validation | SPF, DKIM, DMARC record checking |
| Mailbox management | Register Google Workspace / SMTP mailboxes |
| Warm-up scheduler | Automated warm-up with daily limits |
| Suppression lists | Global and per-campaign suppression management |
| Deliverability rules | Pre-send check engine (all rules from ADR-0006) |
| Health scoring | Mailbox and domain health computation |
| Deliverability dashboard | Health scores, send stats, reputation metrics |

### Acceptance Criteria

- [ ] User can add a domain and see DNS configuration instructions
- [ ] System validates SPF, DKIM, DMARC records
- [ ] User can register mailboxes and see warm-up progress
- [ ] Warm-up schedule follows defined ramp (5→10→20→35→50/day)
- [ ] Suppression list prevents sends to listed addresses
- [ ] Health score computed and displayed per mailbox
- [ ] Deliverability rules block sends that fail any check
- [ ] All deliverability rules have unit tests (100% coverage)

### Out of Scope

- Campaign execution, actual email sending, reply detection

---

## M5 — Campaigns & Replies

**Goal:** End-to-end outbound: launch campaigns, send emails, detect replies, and view analytics.

### Deliverables

| Item | Detail |
|------|--------|
| Campaign builder | Select ICP, sequence, mailboxes; configure schedule |
| Campaign execution | Launch, pause, resume campaigns |
| Send scheduler | Timezone-aware send windows, rate limiting, mailbox rotation |
| Email sending | Send via configured mailboxes with deliverability checks |
| Reply detection | Parse inbox for replies; classify intent |
| Follow-up automation | Auto-advance or pause sequences on reply |
| Bounce handling | Hard/soft bounce detection and suppression |
| Unsubscribe handling | Process unsubscribe requests automatically |
| Campaign analytics | Send, open, reply, bounce rates |
| Notification system | Alert operators for replies, bounces, anomalies |
| Campaign auto-pause | Pause on deliverability degradation |

### Acceptance Criteria

- [ ] User can create and launch a campaign from qualified leads
- [ ] Emails sent respecting daily limits, warm-up, and rotation
- [ ] Replies detected and classified within 15 minutes
- [ ] Follow-up sequences pause on reply
- [ ] Hard bounces added to suppression list automatically
- [ ] Unsubscribe requests processed and contact suppressed
- [ ] Campaign dashboard shows send, reply, and bounce metrics
- [ ] Operator notified of replies requiring attention
- [ ] Campaign auto-pauses when mailbox health drops below threshold

### Out of Scope

- Meeting booking, proposals, learning/optimization

---

## M6 — Meeting Booking

**Goal:** Engaged leads can book meetings; operators receive pre-meeting briefs.

### Deliverables

| Item | Detail |
|------|--------|
| Calendar integration | Connect operator Google Calendar |
| Availability config | Define bookable time slots |
| Booking links | Generate and embed in outreach emails |
| Booking page | Public page for lead to select time |
| Confirmation flow | Auto-confirm and notify both parties |
| Pre-meeting brief | AI-generated doc from research + reply history |

### Acceptance Criteria

- [ ] Operator connects calendar and sets availability
- [ ] Booking link embeddable in outreach emails
- [ ] Lead can book a meeting from the link
- [ ] Both parties receive confirmation
- [ ] Pre-meeting brief generated with company research and conversation history
- [ ] Meeting appears in operator's dashboard

### Out of Scope

- Proposal generation, video conferencing integration

---

## M7 — Proposals & Invoicing

**Goal:** Convert meetings into proposals and invoices with human approval gates.

### Deliverables

| Item | Detail |
|------|--------|
| Proposal generation | AI-generated from meeting context and research |
| Proposal editor | Review and edit before sending |
| Approval workflow | Human approval required before delivery |
| Proposal delivery | Send via email with tracking |
| Invoice generation | Generate from approved proposal |
| Client onboarding | Trigger onboarding workflow on deal close |

### Acceptance Criteria

- [ ] AI generates proposal based on meeting notes and company research
- [ ] Operator can review, edit, and approve proposal
- [ ] Approved proposal sent to contact via email
- [ ] Invoice generated from approved proposal
- [ ] Onboarding workflow triggered on deal close
- [ ] All actions logged in audit trail

### Out of Scope

- Payment processing integration, contract signing

---

## M8 — Learning & Optimization

**Goal:** Platform analyzes campaign performance and recommends improvements.

### Deliverables

| Item | Detail |
|------|--------|
| Campaign analytics | Deep performance analysis across campaigns |
| A/B testing | Test subject lines, copy variants, send times |
| ICP refinement | Recommend ICP adjustments from outcomes |
| Copy optimization | Identify high-performing messaging patterns |
| Send time optimization | Learn optimal send windows per segment |
| Feedback loops | Incorporate human edits into future generation |

### Acceptance Criteria

- [ ] Analytics dashboard shows performance trends across campaigns
- [ ] A/B test results displayed with statistical significance
- [ ] System recommends ICP adjustments based on conversion data
- [ ] Copy patterns correlated with reply rates
- [ ] Human edits to AI-generated content tracked and used in future prompts
- [ ] Measurable improvement demonstrable over 3+ campaigns

### Out of Scope

- Auto-apply recommendations (human approves changes)

---

## M9 — Production Hardening

**Goal:** Platform is secure, monitored, performant, and ready for commercial deployment.

### Deliverables

| Item | Detail |
|------|--------|
| Performance optimization | Query optimization, caching, edge deployment |
| Security audit | Dependency audit, penetration testing, RLS verification |
| Monitoring & alerting | Uptime, error rates, deliverability alerts |
| Disaster recovery | Backup strategy, documented recovery procedures |
| Operator documentation | User guides, admin guides |
| Runbooks | Incident response for common failure modes |
| Load testing | Verify performance under expected load |
| Commercial readiness | Usage metering hooks, billing integration points |

### Acceptance Criteria

- [ ] p95 API response time < 500ms for dashboard queries
- [ ] Security audit completed with no critical findings
- [ ] Monitoring alerts configured for uptime, errors, and deliverability
- [ ] Backup and recovery tested
- [ ] Operator documentation complete
- [ ] Load test passes at 2x expected initial volume
- [ ] All milestones' acceptance criteria still pass (regression)

---

## Milestone Governance

### Starting a Milestone

1. Prior milestone acceptance criteria verified and approved
2. Milestone branch created: `milestone-N/description`
3. Milestone tasks identified and prioritized
4. Stakeholder sign-off to begin

### Completing a Milestone

1. All acceptance criteria checked
2. Deployed to staging and verified
3. Integration tests pass
4. Documentation updated
5. PR from milestone branch to `main`
6. Tagged: `v0.{N}.0`
7. Stakeholder sign-off

### Changing Milestone Scope

Scope changes require:

1. Updated acceptance criteria in this document
2. Impact assessment on downstream milestones
3. Stakeholder approval
4. Updated roadmap if timeline affected

---

## Related Documents

- [Product Roadmap](../product/roadmap.md)
- [Product Charter](../product/charter.md)
- [Architecture Overview](../architecture/overview.md)
- [Development Workflow](../development/workflow.md)
