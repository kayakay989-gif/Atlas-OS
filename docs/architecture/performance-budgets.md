# Performance Budgets — Atlas Sales OS

**Status:** Active (M0)  
**Related:** ADR-0014

Initial budgets prevent regressions as product features ship.

## Web (apps/web)

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| First Load JS (home) | ≤ 150 kB | Manual review + Next build output |
| Route cold load | ≤ 3s on 4G | Lighthouse CI (future) |
| `/health` response | ≤ 100ms | Playwright smoke test |

## API (future milestones)

| Metric | Budget |
|--------|--------|
| P95 API latency | ≤ 300ms |
| P99 API latency | ≤ 800ms |

## Worker

| Metric | Budget |
|--------|--------|
| Health-check job | ≤ 5s |
| Standard background job | ≤ 60s (configurable per job) |

## Bundle monitoring

- Review `next build` output on every PR
- Investigate regressions > 10 kB on shared chunks
- `@next/bundle-analyzer` optional for deep dives (not enabled in M0)
