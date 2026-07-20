# ADR-0004: Supabase as Primary Backend

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect

## Context

Atlas Sales OS needs:

- A relational database with complex queries and joins
- Multi-tenant data isolation
- Authentication and user management
- File storage for attachments and exports
- Server-side logic for webhooks and lightweight API endpoints
- Real-time updates for dashboard (future)

Building this on raw PostgreSQL + custom auth + S3 + Lambda would require significant infrastructure work before any feature development.

## Decision

Use **Supabase** as the primary backend platform, leveraging:

| Supabase Feature | Usage |
|------------------|-------|
| PostgreSQL | Primary data store; all business data |
| Row-Level Security (RLS) | Multi-tenant isolation on every table |
| Supabase Auth | User authentication; JWT with custom claims |
| Supabase Storage | File uploads (exports, attachments) |
| Edge Functions | Webhooks (email bounces, inbound replies), lightweight API endpoints |
| Database Functions | Complex queries, audit log triggers |
| Realtime (future) | Live campaign status updates in dashboard |

### What Supabase Is NOT Used For

- Long-running jobs (Trigger.dev — see ADR-0007)
- AI inference (direct API calls from worker)
- Browser automation (Playwright in Trigger.dev worker)
- Heavy compute (worker handles this)

### RLS Strategy

Every tenant-scoped table includes `organization_id`. RLS policies enforce:

```sql
CREATE POLICY "Users can only access their org's data"
  ON companies FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);
```

Application code **also** validates `organizationId` — RLS is defense in depth, not the only check.

## Consequences

### Positive

- Auth, DB, Storage, and Edge Functions in one platform
- RLS provides database-level tenant isolation (critical for SaaS)
- Excellent local development with Supabase CLI
- Managed backups, connection pooling, and monitoring
- PostgreSQL means standard SQL, migrations, and tooling

### Negative

- Vendor dependency on Supabase (mitigated: it's standard PostgreSQL underneath)
- Edge Functions use Deno runtime (different from Node.js worker)
- Connection limits on lower tiers
- RLS policies can be complex to debug

### Neutral

- Must generate TypeScript types from schema (`supabase gen types`)
- Migration workflow requires Supabase CLI discipline

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Firebase | NoSQL doesn't fit relational domain; weaker multi-tenant story |
| PlanetScale + Clerk + S3 | Three vendors to manage; more integration work |
| Self-hosted PostgreSQL + custom auth | DevOps overhead before feature work begins |
| AWS RDS + Cognito + Lambda | Enterprise-grade but over-engineered for team size |
| Neon + Auth.js | Good combo but no integrated Storage or Edge Functions |
