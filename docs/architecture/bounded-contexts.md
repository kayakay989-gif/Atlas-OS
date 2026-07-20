# Bounded Context Placeholders — Atlas Sales OS

M0 establishes package boundaries only. Domain logic ships in M1–M5.

| Context | Future location | Milestone |
|---------|-----------------|-----------|
| Identity & Tenancy | `packages/domains/identity/` | M1 |
| CRM Core | `packages/domains/crm/` | M2 |
| Discovery | `packages/domains/discovery/` | M2 |
| Research & Qualification | `packages/domains/research/` | M3 |
| Outreach & Deliverability | `packages/domains/outreach/` | M4 |
| Campaigns & Analytics | `packages/domains/campaigns/` | M5 |

Each context will:

- Publish domain events via `@atlas/events`
- Enqueue jobs via `@atlas/jobs`
- Use provider interfaces from `@atlas/providers`
- Scope all data by `organizationId`

No business code until the corresponding milestone begins.
