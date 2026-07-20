# ADR-0012: Feature Flags Infrastructure

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Lead Architect

## Context

Atlas Sales OS is built in milestones. Incomplete modules must exist in the codebase without affecting production behavior. We need feature flags from the foundation — not a third-party SaaS (LaunchDarkly, etc.) per ADR-0008.

## Decision

Implement **internal feature flag infrastructure** in `@atlas/config` (Phase 5 of M0).

### Design

```typescript
interface FeatureFlags {
  readonly discoveryPipeline: boolean
  readonly outreachGeneration: boolean
  readonly emailSending: boolean
  readonly meetingBooking: boolean
  // extended per milestone
}

function getFeatureFlags(context: { organizationId?: string }): FeatureFlags
```

### Flag Sources (priority order)

1. **Environment variables** — global kill switches (`FF_EMAIL_SENDING=false`)
2. **Database** (M1+) — per-organization overrides in `organization_settings`
3. **Default registry** — safe defaults (all incomplete features `false` until milestone complete)

### Rules

- Incomplete milestones ship with flags defaulting to `false`
- Flags checked at module boundaries, not scattered in UI
- Flag names match milestone/module names
- No LaunchDarkly or external flag SaaS in v1

### UI Behavior

When a flag is off: route returns 404 or "Coming soon" — module does not partially render.

## Consequences

### Positive

- Incomplete code can merge to main safely
- Per-org enablement for beta testing (M1+)
- Zero SaaS cost

### Negative

- We maintain flag registry manually
- Stale flags must be cleaned up after milestones complete

### Neutral

- Scaffold in M0 Phase 5; flags added as modules are built

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| LaunchDarkly / Unleash | SaaS cost; ADR-0008 build-first |
| Branch-only development | Prevents continuous integration on main |
| No flags (hide via routing only) | Insufficient for worker jobs and API paths |
