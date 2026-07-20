# Atlas Sales OS — Documentation

This directory contains all project documentation. Code lives at the repository root; documentation lives here.

---

## Documentation Map

### Product

| Document | Description |
|----------|-------------|
| [charter.md](./product/charter.md) | Product vision, scope, personas, and success metrics |
| [roadmap.md](./product/roadmap.md) | Long-term product roadmap and capability timeline |

### Architecture

| Document | Description |
|----------|-------------|
| [overview.md](./architecture/overview.md) | High-level system architecture |
| [folder-structure.md](./architecture/folder-structure.md) | Planned repository layout |
| [adrs/](./architecture/adrs/README.md) | Architecture Decision Records |

### Development

| Document | Description |
|----------|-------------|
| [workflow.md](./development/workflow.md) | Day-to-day development process |
| [coding-standards.md](./development/coding-standards.md) | Code style, patterns, and conventions |
| [git-strategy.md](./development/git-strategy.md) | Branching, commits, PRs, and releases |
| [testing-strategy.md](./development/testing-strategy.md) | Testing approach and expectations |
| [environment-setup.md](./development/environment-setup.md) | Local dev setup (populated at Milestone 0) |

### Milestones

| Document | Description |
|----------|-------------|
| [milestone-plan.md](./milestones/milestone-plan.md) | Phased delivery plan with acceptance criteria |
| [m0-implementation-plan.md](./milestones/m0-implementation-plan.md) | M0 phased implementation plan |
| [Project State](../PROJECT_STATE.md) | Current phase and progress (source of truth) |

### Compliance & Security

| Document | Description |
|----------|-------------|
| [compliance/overview.md](./compliance/overview.md) | Regulatory framework and responsible outreach |
| [compliance/email-regulations.md](./compliance/email-regulations.md) | CAN-SPAM, GDPR, CASL guidance |
| [security/overview.md](./security/overview.md) | Security principles and threat model |

### Operations

| Document | Description |
|----------|-------------|
| [deployment.md](./operations/deployment.md) | Environments, CI/CD, and release process |

### AI & Prompts

| Document | Description |
|----------|-------------|
| [../prompts/README.md](../prompts/README.md) | Prompt engineering guidelines and registry |

---

## How to Use This Documentation

1. **New to the project?** Start with [Product Charter](./product/charter.md) and [Architecture Overview](./architecture/overview.md).
2. **Starting development?** Read [Milestone Plan](./milestones/milestone-plan.md), [Development Workflow](./development/workflow.md), and [Coding Standards](./development/coding-standards.md).
3. **Making an architectural change?** Create a new ADR in [architecture/adrs/](./architecture/adrs/README.md).
4. **Shipping a feature?** Follow [Git Strategy](./development/git-strategy.md) and [Deployment](./operations/deployment.md).

---

## Document Conventions

- All documents use Markdown.
- ADRs are numbered sequentially and are immutable once accepted; supersede with a new ADR rather than editing history.
- Dates use ISO 8601 format (`YYYY-MM-DD`).
- Status labels: `Draft`, `Proposed`, `Accepted`, `Deprecated`, `Superseded`.

---

## Maintenance

Documentation is a first-class deliverable. When code changes affect architecture, workflows, or compliance posture, update the relevant doc in the same PR.
