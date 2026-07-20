# Development Workflow — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Overview

This document defines how we build, review, test, and ship Atlas Sales OS. Every contributor follows this workflow regardless of role.

---

## Development Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Plan    │───▶│  Build   │───▶│  Review  │───▶│  Test    │───▶│  Ship    │
│          │    │          │    │          │    │          │    │          │
│ Milestone│    │ Feature  │    │ PR review│    │ CI + manual│   │ Deploy   │
│ task     │    │ branch   │    │ + ADR    │    │ testing  │    │ + verify │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Before Writing Code

1. **Read [PROJECT_STATE.md](../../PROJECT_STATE.md)** — Source of truth for current phase, pending work, known issues, and debt.
2. **Confirm milestone scope** — Is this work part of the current milestone phase? If not, stop.
3. **Check for existing patterns** — Read surrounding code and docs before introducing new patterns.
4. **Architectural changes** — Create or update an ADR ([see enforcement rule](../architecture/adrs/README.md)).
5. **New dependencies** — Complete the checklist in [dependencies.md](../architecture/dependencies.md).
6. **Build vs buy check** — Apply [ADR-0008](../architecture/adrs/0008-build-vs-buy-policy.md) criteria.
7. **Break down the work** — Large features become multiple PRs; each phase should be one logical commit.

## After Completing Work

1. Run `pnpm validate` (lint, typecheck, test, build).
2. **Update [PROJECT_STATE.md](../../PROJECT_STATE.md)** — Required before requesting review or starting the next phase.
3. Provide summary: files changed, why, validation results, recommended commit message.
4. **Wait for approval** before starting the next M0 phase.

---

## Branch Workflow

See [Git Strategy](./git-strategy.md) for full details. Summary:

```
main (protected)
  └── milestone-N/description
        └── feature/short-description
```

1. Branch from current milestone branch (or `main` if no active milestone branch)
2. Use descriptive branch names: `feature/campaign-list`, `fix/bounce-suppression`
3. Keep branches short-lived (< 3 days ideal)
4. Rebase on base branch before opening PR

---

## Pull Request Process

### Before Opening a PR

- [ ] Code compiles with no TypeScript errors
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] No secrets or `.env` files committed
- [ ] Database migrations included if schema changed
- [ ] Documentation updated if behavior or architecture changed

### PR Requirements

| Requirement | Detail |
|-------------|--------|
| Title | Conventional commit format: `feat: add campaign list view` |
| Description | What, why, and how to test |
| Size | < 400 lines changed (excluding migrations and generated files) |
| Reviewers | At least 1 approval required |
| CI | All checks must pass |
| ADR | Required for architectural changes |

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2

## Test Plan
- [ ] Step to verify change 1
- [ ] Step to verify change 2

## Screenshots (if UI)
[Before/after screenshots]

## Related
- Milestone: M{N}
- ADR: ADR-NNNN (if applicable)
```

---

## Local Development (Future — Milestone 0)

Once Milestone 0 is complete, local development follows:

```bash
# Install dependencies
pnpm install

# Start Supabase locally
pnpm supabase:start

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start all apps in dev mode
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint
```

Full setup instructions will be in [environment-setup.md](./environment-setup.md).

---

## Code Review Standards

Reviewers check for:

| Category | Questions |
|----------|-----------|
| **Correctness** | Does it work? Edge cases handled? |
| **Security** | RLS policies? Input validation? No secrets exposed? |
| **Multi-tenancy** | Is `organizationId` validated everywhere? |
| **Performance** | N+1 queries? Unnecessary re-renders? |
| **Testing** | Are critical paths tested? |
| **Consistency** | Follows coding standards? Matches existing patterns? |
| **Documentation** | ADR needed? Docs updated? |
| **Scope** | Is this PR focused? Anything that should be a separate PR? |

### Review Response Times

| Priority | Expected Response |
|----------|-------------------|
| Blocking bug fix | Same day |
| Feature PR | Within 1 business day |
| Documentation | Within 2 business days |

---

## Testing Requirements

See [Testing Strategy](./testing-strategy.md) for full details. Minimum per PR:

| Change Type | Required Tests |
|-------------|----------------|
| New API endpoint / query | Unit test for validation + integration test |
| New UI component | Component test (render + interaction) |
| Bug fix | Regression test |
| Database migration | Migration applies cleanly; RLS policies verified |
| Background job | Unit test for handler logic |
| AI prompt change | Snapshot or evaluation test |

---

## Database Changes

1. Create migration: `pnpm supabase migration new description`
2. Write SQL in the generated migration file
3. Include RLS policies in the same migration as table creation
4. Test locally: `pnpm db:migrate`
5. Generate types: `pnpm db:types`
6. Never edit an applied migration — create a new one

---

## Environment Management

| Environment | Purpose | Deploy Trigger |
|-------------|---------|----------------|
| Local | Development | Manual |
| Preview | PR review | Automatic on PR |
| Staging | Pre-production testing | Manual or on merge to milestone branch |
| Production | Live system | Manual approval on merge to `main` |

### Environment Variables

- All secrets in environment variables, never in code
- `.env.example` documents required variables (no values)
- Each environment has its own Supabase project and API keys
- Production secrets managed via Vercel/Supabase dashboards

---

## Definition of Done

A task is done when:

- [ ] Code merged to the appropriate branch
- [ ] CI passes on merge
- [ ] Deployed to staging and verified
- [ ] Tests written and passing
- [ ] Documentation updated (if applicable)
- [ ] No known regressions
- [ ] Milestone acceptance criteria met (if milestone-ending task)

---

## Incident Response (Future)

When production issues occur:

1. **Assess** — Is data at risk? Is email sending affected?
2. **Mitigate** — Pause campaigns if deliverability issue; disable feature flag if bug
3. **Fix** — Hotfix branch from `main`, expedited review
4. **Post-mortem** — Document root cause and prevention for any SEV-1/SEV-2 incident

Runbooks will be added in `docs/operations/runbooks/` as the platform matures.

---

## Related Documents

- [Git Strategy](./git-strategy.md)
- [Coding Standards](./coding-standards.md)
- [Testing Strategy](./testing-strategy.md)
- [Deployment](../operations/deployment.md)
- [Milestone Plan](../milestones/milestone-plan.md)
