# Atlas Sales OS

**An AI-powered outbound sales operating system for Atlas Solutions.**

Atlas Sales OS is not a CRM. It is an autonomous outbound sales platform designed to progressively automate discovery, research, qualification, outreach, follow-up, and conversion—while keeping humans in the loop only where judgment adds value.

---

## Status

**Milestone 7 complete** — proposal generation, approval, mock send, invoicing, and client onboarding workflows. M8 (Learning & Optimization) is next.

See [PROJECT_STATE.md](./PROJECT_STATE.md) and [docs/README.md](./docs/README.md).

---

## Quick Links

| Document                                                    | Purpose                                         |
| ----------------------------------------------------------- | ----------------------------------------------- |
| [Project State](./PROJECT_STATE.md)                         | Current milestone, progress, decisions, debt    |
| [Product Charter](./docs/product/charter.md)                | Vision, principles, scope, and success criteria |
| [Roadmap](./docs/product/roadmap.md)                        | Long-term product direction                     |
| [Milestone Plan](./docs/milestones/milestone-plan.md)       | Phased delivery plan with dependencies          |
| [Architecture Overview](./docs/architecture/overview.md)    | System design and component boundaries          |
| [Folder Structure](./docs/architecture/folder-structure.md) | Repository layout plan                          |
| [ADRs](./docs/architecture/adrs/README.md)                  | Architecture Decision Records                   |
| [Development Workflow](./docs/development/workflow.md)      | How we build and ship                           |
| [Coding Standards](./docs/development/coding-standards.md)  | Code quality and conventions                    |
| [Git Strategy](./docs/development/git-strategy.md)          | Branching, commits, and releases                |
| [Testing Strategy](./docs/development/testing-strategy.md)  | Test pyramid and coverage expectations          |
| [Compliance Overview](./docs/compliance/overview.md)        | Regulatory and responsible outreach framework   |
| [Security Overview](./docs/security/overview.md)            | Security principles and threat model            |
| [Deployment](./docs/operations/deployment.md)               | Environments and release process                |

---

## Tech Stack (Approved)

| Layer              | Technology                                           |
| ------------------ | ---------------------------------------------------- |
| Frontend           | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui  |
| Backend            | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| Hosting            | Vercel                                               |
| AI                 | OpenAI, Gemini                                       |
| Browser Automation | Playwright                                           |
| Web Extraction     | Firecrawl (when appropriate)                         |
| Job Orchestration  | Trigger.dev (abstracted via `@atlas/jobs`)           |
| Email              | Google Workspace, SMTP, Resend                       |
| Validation         | Zod                                                  |
| State              | Zustand                                              |
| Forms              | React Hook Form                                      |

---

## Core Principles

1. **Automation first** — Automate by default; require human action only where judgment is valuable.
2. **AI first** — AI is a core capability, not a bolt-on feature.
3. **Modular** — Bounded contexts with clear interfaces; no monolithic god modules.
4. **Event driven** — Domain events decouple producers from consumers.
5. **Production ready** — Every milestone ships a deployable, testable increment.
6. **Secure & compliant** — Security and responsible outreach are designed in, not added later.

---

## Getting Started

**Windows:** `./scripts/bootstrap.ps1`  
**macOS/Linux:** `./scripts/bootstrap.sh`

Then see [docs/development/environment-setup.md](./docs/development/environment-setup.md).

---

## License

Proprietary — Atlas Solutions. All rights reserved.
