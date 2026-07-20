# ADR-0014: Performance Budgets

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Lead Architect

## Context

Performance regressions are expensive to fix late. Establishing budgets in M0 creates measurable targets before feature code accumulates.

## Decision

Adopt the following **performance budgets**. CI enforcement is progressive — documented in M0, enforced in M0 Phase 11+ and M9.

### Web (apps/web)

| Metric | Budget | Measured By |
|--------|--------|-------------|
| First Load JS (dashboard shell) | < 150 KB gzip | Next.js build output |
| Lighthouse Performance (shell) | > 90 | Playwright + Lighthouse (M11+) |
| Time to Interactive (shell) | < 2s on 3G | Playwright (M11+) |
| Cold page load (/) | < 1s local | Manual / CI smoke |

### API / Server Actions (future)

| Metric | Budget |
|--------|--------|
| Dashboard query p95 | < 500ms |
| Mutation p95 | < 800ms |

### Worker Jobs

| Job Type | Budget |
|----------|--------|
| Health check | < 5s |
| Research (per company) | < 5 min |
| Email queue processing | < 30s per batch |
| Outbox consumer cycle | < 10s |

### Bundle Monitoring

- Next.js `experimental.optimizePackageImports` where applicable
- `@next/bundle-analyzer` available via `pnpm analyze` (M0 Phase 11)
- PR comment if First Load JS increases > 10% (M13+)

### Documentation

Budgets live in `docs/architecture/performance-budgets.md` (created Phase 11).

## Consequences

### Positive

- Prevents gradual performance degradation
- Clear targets for M9 hardening

### Negative

- CI bundle checks add pipeline time

### Neutral

- Budgets documented now; automated enforcement added with testing infrastructure

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| No budgets until M9 | Too late; shell already bloated |
| Strict CI from day one | No baseline yet; progressive enforcement |
