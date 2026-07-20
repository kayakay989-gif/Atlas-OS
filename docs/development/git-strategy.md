# Git Strategy — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Overview

This document defines branching strategy, commit conventions, release process, and repository hygiene for Atlas Sales OS.

---

## Branching Model

We use a **milestone-based trunk development** model. `main` is always deployable. Feature work happens on short-lived branches.

```
main ──────────────────────────────────────────────▶ (production)
  │
  ├── milestone-1/auth-and-tenancy ──────────────▶ (merge to main when M1 complete)
  │     ├── feature/org-management
  │     ├── feature/rls-policies
  │     └── fix/auth-redirect
  │
  ├── milestone-2/discovery ─────────────────────▶ (merge to main when M2 complete)
  │     ├── feature/icp-configuration
  │     └── feature/company-discovery
  │
  └── hotfix/bounce-suppression ─────────────────▶ (merge directly to main)
```

### Branch Types

| Type | Pattern | Base | Merge Target | Lifetime |
|------|---------|------|--------------|----------|
| **Main** | `main` | — | — | Permanent |
| **Milestone** | `milestone-N/description` | `main` | `main` | Weeks (milestone duration) |
| **Feature** | `feature/short-description` | Milestone or `main` | Milestone or `main` | 1–3 days |
| **Fix** | `fix/short-description` | Milestone or `main` | Milestone or `main` | Hours |
| **Hotfix** | `hotfix/short-description` | `main` | `main` | Hours |
| **Docs** | `docs/short-description` | `main` | `main` | Hours |

### Branch Rules

1. **`main` is protected** — No direct pushes; PR required with approval
2. **Milestone branches** are long-lived for the duration of a milestone; merged to `main` when milestone acceptance criteria are met
3. **Feature branches** are short-lived; rebase before opening PR
4. **Hotfix branches** bypass milestone branches; merge directly to `main` then cherry-pick to active milestone branch if applicable
5. **Delete branches** after merge

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies, tooling |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace (not CSS) |

### Scopes

Use bounded context names:

`auth`, `discovery`, `research`, `qualification`, `outreach`, `campaign`, `deliverability`, `inbox`, `conversion`, `analytics`, `compliance`, `notification`, `ui`, `db`, `worker`, `ai`, `email`

### Examples

```
feat(campaign): add campaign pause and resume actions
fix(deliverability): suppress hard-bounced addresses immediately
docs(architecture): add ADR-0007 for Trigger.dev scheduling
refactor(database): extract campaign queries to packages/database
test(qualification): add lead scoring unit tests
chore(ci): add Turborepo remote caching
```

### Rules

- Subject line: imperative mood, max 72 characters, no period
- Body: explain **why**, not what (the diff shows what)
- Reference milestone or issue in footer: `Milestone: M4` or `Closes #42`
- One logical change per commit; squash fixup commits before merge

---

## Pull Request Process

### Creating a PR

1. Rebase on target branch
2. Ensure CI passes locally
3. Open PR with conventional title
4. Fill in PR template (see [Development Workflow](./workflow.md))
5. Request review

### Merging

| Target | Strategy | Requirements |
|--------|----------|-------------|
| Milestone branch | Squash merge | 1 approval, CI green |
| `main` (milestone completion) | Merge commit | 1 approval, CI green, all milestone criteria met |
| `main` (hotfix) | Squash merge | 1 approval, CI green, expedited review |

### PR Size Guidelines

| Size | Lines Changed | Action |
|------|---------------|--------|
| Small | < 100 | Ideal |
| Medium | 100–400 | Acceptable |
| Large | 400–800 | Should be split if possible |
| Too large | > 800 | Must be split |

---

## Release Process

### Milestone Release

When a milestone is complete:

1. Verify all acceptance criteria met (see [Milestone Plan](../milestones/milestone-plan.md))
2. Final PR from milestone branch to `main`
3. Merge to `main`
4. CI deploys to staging automatically
5. Manual verification on staging
6. Promote to production (manual trigger)
7. Tag release: `v0.{milestone}.0`
8. Delete milestone branch

### Version Numbering

```
v{major}.{milestone}.{patch}

v0.1.0  — Milestone 1 complete
v0.2.0  — Milestone 2 complete
...
v0.9.0  — Milestone 9 complete
v1.0.0  — Production/commercial release
```

Patch versions (`v0.2.1`) for hotfixes between milestones.

### Hotfix Release

1. Branch from `main`: `hotfix/description`
2. Fix, test, PR to `main`
3. Merge, deploy, tag: `v0.{milestone}.{patch+1}`
4. Cherry-pick to active milestone branch if applicable

---

## Tags

```bash
# Milestone release
git tag -a v0.1.0 -m "Milestone 1: Auth & Tenancy"
git push origin v0.1.0

# Hotfix
git tag -a v0.4.1 -m "Fix: bounce suppression not applied on hard bounce"
git push origin v0.4.1
```

---

## Repository Hygiene

### What Never Gets Committed

| Item | Reason |
|------|--------|
| `.env`, `.env.local` | Secrets |
| `node_modules/` | Generated |
| `.next/`, `dist/`, `build/` | Generated |
| IDE-specific files (except shared config) | Personal preference |
| Generated database types (if CI generates them) | Generated |
| Large binary files | Use Supabase Storage |

### `.gitignore`

Maintained at repository root. See current `.gitignore` for full list.

### Sensitive Data

If secrets are accidentally committed:

1. Rotate the compromised secret immediately
2. Do not just delete the file — secrets persist in git history
3. Use `git filter-repo` or BFG to purge from history
4. Force push is required (coordinate with team)

---

## GitHub Configuration (Milestone 0)

The following GitHub settings will be configured during Milestone 0:

| Setting | Value |
|---------|-------|
| Default branch | `main` |
| Branch protection (main) | Require PR, 1 approval, CI must pass |
| Branch protection (main) | No force push, no direct push |
| Auto-delete head branches | Enabled |
| Squash merge | Allowed (default) |
| Merge commit | Allowed (milestone merges only) |
| Rebase merge | Disabled |

---

## Related Documents

- [Development Workflow](./workflow.md)
- [Deployment](../operations/deployment.md)
- [Milestone Plan](../milestones/milestone-plan.md)
