# Dependency Evaluation Framework — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-20

---

## Purpose

Every major dependency must be justified before adoption. This project minimizes long-term SaaS cost and vendor lock-in by defaulting to **build when practical**.

See also [ADR-0008: Build vs Buy](./adrs/0008-build-vs-buy-policy.md).

---

## Evaluation Checklist

Before adding any dependency, answer:

| Question | If Yes | If No |
|----------|--------|-------|
| Can we build this ourselves with reasonable effort (< ~1 week)? | Prefer build | Continue evaluation |
| Is the dependency mature and actively maintained? | Continue | Reject or find alternative |
| Would replacing it later be difficult? | Require adapter layer | Lower risk |
| Is it business-critical infrastructure? | May justify third-party | Prefer build |

**All major dependencies must be documented in the table below.**

---

## Approved Dependencies (M0)

| Dependency | Category | Why Not Build | Abstraction | Replaceability |
|------------|----------|---------------|-------------|----------------|
| **Next.js** | Web framework | Years of SSR/RSC infrastructure | Standard App Router | Medium — app is Next-native |
| **React** | UI runtime | Industry standard | N/A (platform choice) | Medium |
| **TypeScript** | Language | Type safety at scale | N/A | Low need to replace |
| **Turborepo** | Monorepo orchestration | Build cache/pipeline infra | Root config only | High — no vendor SDK in app code |
| **pnpm** | Package manager | Workspace + disk efficiency | N/A | High |
| **Supabase** | DB, Auth, Storage | Managed Postgres + RLS + Auth | `@atlas/database` | Medium — standard PostgreSQL underneath |
| **Trigger.dev** | Job orchestration | Long-running jobs, retries, observability | `@atlas/jobs` | High — adapter in worker only |
| **OpenAI / Gemini** | AI inference | Model training not our business | `packages/providers/ai/` | High — multi-provider |
| **Resend** | Transactional email | Deliverability infra for system mail | `packages/providers/email/` | High |
| **Google Workspace** | Outbound mailboxes | Full mailbox protocol impractical | `packages/providers/email/` | Medium |
| **Tailwind CSS** | Styling | Utility-first standard | N/A | High |
| **shadcn/ui** | Components | Copy-paste, no lock-in | `@atlas/ui` | High |
| **Zod** | Validation | Small, focused, no alternative benefit | Used in `@atlas/types` | High |
| **Vitest** | Unit testing | Test runner infra | Config in `@atlas/config` | High |
| **Playwright** | E2E testing | Browser automation infra | `apps/web/e2e/` | High |
| **ESLint / Prettier** | Code quality | Standard tooling | `@atlas/config` | High |
| **Husky / lint-staged** | Git hooks | Standard DX tooling | Root config | High |
| **Vercel** | Hosting | Commodity CDN/deploy | Standard Next deploy | Medium |

---

## Dependencies We Build Ourselves

| Capability | Package | Rationale |
|------------|---------|-----------|
| Job orchestration interface | `@atlas/jobs` | Swap Trigger.dev without touching business logic |
| Structured logging | `@atlas/shared` (logger) | No SaaS cost; event-aligned output |
| Feature flags | `@atlas/config` (flags) | Simple DB/env flags; no LaunchDarkly initially |
| Provider routing | `packages/providers/*` | Core competitive architecture |
| Domain events | `@atlas/events` | Own our event catalog |
| Error hierarchy | `@atlas/shared` | Consistent errors across apps |

---

## Adding a New Dependency

1. Complete the evaluation checklist above.
2. Identify the abstraction package (or create one).
3. Add a row to this document in the same PR.
4. If the decision is significant, create an ADR.

---

## Related Documents

- [ADR-0008: Build vs Buy](./adrs/0008-build-vs-buy-policy.md)
- [ADR-0011: Provider Plugin Architecture](./adrs/0011-provider-plugin-architecture.md)
- [M0 Implementation Plan](../milestones/m0-implementation-plan.md)
