# Product Charter — Atlas Sales OS

**Version:** 1.1  
**Status:** Accepted  
**Last Updated:** 2026-07-19  
**Owner:** Atlas Solutions

---

## Executive Summary

Atlas Sales OS is an AI-powered outbound sales operating system built for Atlas Solutions. It automates the full outbound sales lifecycle—from company discovery through meeting booking and client onboarding—while preserving human oversight at decision points that require judgment.

This is **not** a CRM. It does not replace HubSpot, Salesforce, or similar systems. It is a purpose-built autonomous outbound engine that orchestrates AI agents, data pipelines, and email infrastructure to run outbound sales at scale with minimal manual effort.

---

## Problem Statement

Outbound sales is fragmented across dozens of tools: prospecting databases, enrichment services, email sequencers, research assistants, proposal generators, and CRMs. Each tool requires manual handoffs, duplicates data, and lacks a unified intelligence layer.

Teams spend most of their time on repetitive work—finding leads, researching companies, writing emails, following up—rather than on high-value activities like sales calls and strategic decisions.

Atlas Sales OS solves this by treating outbound sales as an **operating system**: a single platform where AI agents execute workflows, humans approve where needed, and the system learns from outcomes.

---

## Vision

> Automate almost every part of outbound sales while keeping a human involved only where judgment is valuable.

The long-term platform should autonomously:

| Capability | Description |
|------------|-------------|
| **Discover** | Find companies matching configurable ICP criteria |
| **Research** | Crawl public websites responsibly; analyze branding, UX, and positioning |
| **Enrich** | Find publicly available business contact information |
| **Qualify** | Score and prioritize leads against configurable rules |
| **Outreach** | Generate personalized, context-aware email sequences |
| **Send** | Execute campaigns with deliverability safeguards |
| **Follow up** | Detect replies, handle bounces, manage sequences |
| **Convert** | Book meetings, generate proposals, issue invoices |
| **Onboard** | Initiate client onboarding workflows |
| **Learn** | Improve targeting, messaging, and timing from campaign outcomes |

---

## What This Product Is Not

- **Not a CRM** — No deal pipeline management as a primary function. CRM integration may come later.
- **Not a generic marketing automation tool** — Focused on B2B outbound, not newsletters or drip marketing.
- **Not a data broker** — Uses publicly available business information responsibly; users configure data sources and policies.
- **Not a spam engine** — Deliverability, compliance, and sender reputation are core product concerns.

---

## Target Users

### Primary Persona: Outbound Sales Operator

- Runs outbound campaigns for Atlas Solutions or client accounts
- Needs to launch campaigns quickly without manual research per lead
- Wants visibility into campaign performance and AI decisions
- Intervenes only for approvals, calls, and strategy adjustments

### Secondary Persona: Sales Leadership

- Sets ICP criteria, outreach policies, and approval thresholds
- Reviews aggregate performance and ROI
- Configures compliance rules and sending limits

### Tertiary Persona: Platform Administrator

- Manages domains, mailboxes, API keys, and integrations
- Monitors deliverability health and system status
- Handles user access and audit review

---

## Core Principles

These principles govern every product and engineering decision:

1. **Product first** — Build the best AI-powered outbound sales platform possible. Every decision prioritizes automation, AI capability, developer experience, maintainability, and future commercial viability—not implementation speed alone.
2. **AI-first architecture** — The platform is built around autonomous AI workers, not AI as a feature. Every subsystem asks: can this become an agent? Can it decide instead of requiring a click? Can it improve itself?
3. **Automation first** — Default to automated execution; require human action only at defined approval gates.
4. **Own the stack** — Minimize third-party SaaS dependencies. Build when practical; buy only when build cost is prohibitive and the service is abstracted behind our interfaces (see ADR-0008).
5. **Human-in-the-loop by design** — Humans review notifications, join calls, approve proposals, and adjust strategy. Autonomy levels are configurable per agent (Levels 0–4).
6. **Responsible outreach** — Compliance, consent, and sender reputation are product features, not afterthoughts.
7. **Pluggable providers** — Discovery and enrichment sources implement a common interface. No vendor lock-in to Apollo or any single data provider (see ADR-0009).
8. **Agent memory** — AI agents remember companies, outreach, website changes, conversations, performance, and decisions. The platform grows smarter over time (see ADR-0010).
9. **Progressive autonomy** — Ship working increments; each milestone increases automation without breaking prior functionality.
10. **Transparency** — AI decisions, data sources, and outreach history are auditable.

---

## Scope

### In Scope (Long-Term)

- Multi-tenant SaaS platform for Atlas Solutions
- Configurable ICP and lead discovery
- AI-powered company research and website analysis
- Lead qualification and scoring
- Personalized outreach generation
- Email campaign execution with deliverability controls
- Reply detection and follow-up automation
- Meeting booking integration
- Proposal and invoice generation
- Campaign analytics and learning loops
- Audit logs, suppression lists, and compliance tooling

### Out of Scope (Initial Releases)

- Full CRM functionality (deal stages, pipeline views)
- Inbound lead management
- Social media outreach (LinkedIn automation, etc.) — may be evaluated later
- Phone/SMS outreach — email-first for v1
- White-label multi-brand SaaS for external customers — internal use first, commercialization later

### Explicit Non-Goals

- Scraping personal email addresses or non-business contact data
- Bypassing robots.txt or terms of service
- Sending without unsubscribe mechanisms
- Operating without audit trails

---

## Success Metrics

### Phase 1 (Internal MVP)

| Metric | Target |
|--------|--------|
| Time to launch a campaign | < 30 minutes (vs. days manually) |
| Emails sent per campaign | Configurable, within deliverability limits |
| Reply detection accuracy | > 95% |
| System uptime | 99.5% |
| Human touchpoints per 100 leads | < 5 (approvals + calls only) |

### Phase 2 (Optimization)

| Metric | Target |
|--------|--------|
| Meeting book rate | Measurable improvement vs. baseline |
| Bounce rate | < 2% |
| Spam complaint rate | < 0.1% |
| AI personalization acceptance rate | > 80% without edits |
| Campaign learning loop | Measurable improvement in reply rates over 3+ campaigns |

### Phase 3 (Commercial Readiness)

| Metric | Target |
|--------|--------|
| Multi-tenant isolation | Verified via security audit |
| Compliance audit readiness | CAN-SPAM, GDPR, CASL configurable |
| Onboarding time for new operator | < 2 hours |

---

## Human vs. Automated Responsibilities

| Activity | Default Owner |
|----------|---------------|
| Set ICP and campaign strategy | Human |
| Discover and research companies | Automated |
| Find business contact info | Automated (public sources only) |
| Qualify leads | Automated (human override available) |
| Generate outreach copy | Automated (human approval optional/configurable) |
| Send emails | Automated (within limits) |
| Detect replies and bounces | Automated |
| Follow-up sequences | Automated |
| Join sales calls | Human |
| Approve proposals | Human |
| Adjust strategy based on results | Human (system recommends) |
| Learn and optimize | Automated (human reviews changes) |

---

## Competitive Positioning

| Dimension | Traditional Stack | Atlas Sales OS |
|-----------|-------------------|----------------|
| Architecture | 5–10 disconnected tools | Single operating system |
| Intelligence | Manual per-lead research | AI agents at every stage |
| Personalization | Mail merge templates | Context-aware generation from live research |
| Deliverability | Per-tool, inconsistent | Platform-native reputation management |
| Learning | Manual A/B testing | Continuous optimization from campaign data |
| Human effort | High touch throughout | Touch only at judgment gates |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email deliverability damage | High | Dedicated domains, warm-up, limits, health scoring, auto-pause |
| Regulatory non-compliance | High | Configurable compliance rules, audit logs, suppression lists |
| AI hallucination in outreach | Medium | Ground AI in research data; human approval gates; quality scoring |
| Over-automation without oversight | Medium | Configurable approval workflows; notification system |
| Scope creep toward CRM | Medium | Charter enforcement; ADR process for scope changes |
| Data source reliability | Medium | Pluggable source architecture; fallback and validation |
| Vendor lock-in (AI, email) | Low–Medium | Abstract AI and email providers behind interfaces |

---

## Approval Gates

The following require explicit stakeholder approval before implementation:

- Changes to this charter's scope or principles
- Commercialization / external customer access
- New data source integrations that touch PII
- Architectural changes documented as ADRs marked "Proposed"

---

## Related Documents

- [Roadmap](./roadmap.md)
- [Milestone Plan](../milestones/milestone-plan.md)
- [Architecture Overview](../architecture/overview.md)
- [Compliance Overview](../compliance/overview.md)
