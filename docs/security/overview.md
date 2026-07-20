# Security Overview — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Security Philosophy

Atlas Sales OS handles business contact data, email credentials, AI API keys, and outbound email infrastructure. A security breach could expose client data, damage sender reputation, or enable unauthorized email sending.

Security is **defense in depth**: no single layer is trusted alone.

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network (TLS everywhere, Vercel/Supabase)     │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Authentication (Supabase Auth, JWT)           │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Authorization (RBAC + RLS)                      │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Application (Input validation, org scoping)   │
├─────────────────────────────────────────────────────────┤
│ Layer 5: Data (Encryption at rest, audit logs)           │
├─────────────────────────────────────────────────────────┤
│ Layer 6: Infrastructure (Secrets management, monitoring) │
└─────────────────────────────────────────────────────────┘
```

---

## Threat Model

### Assets

| Asset | Sensitivity | Impact if Compromised |
|-------|-------------|----------------------|
| User credentials | High | Account takeover |
| Organization data (companies, contacts) | High | Data breach, competitive exposure |
| Email mailbox credentials | Critical | Unauthorized email sending, reputation damage |
| AI API keys | Medium | Cost abuse, data leakage to AI provider |
| Email content (outreach copy) | Medium | Business strategy exposure |
| Audit logs | High | Tampering hides malicious activity |
| Suppression lists | High | Sending to opted-out contacts (legal liability) |

### Threat Actors

| Actor | Motivation | Likely Attack |
|-------|------------|---------------|
| External attacker | Data theft, email abuse | API exploitation, credential stuffing |
| Malicious tenant | Access other tenants' data | Cross-tenant data access via API |
| Compromised operator account | Send unauthorized emails | Abuse mailbox credentials |
| Insider | Data exfiltration | Direct database access |
| AI prompt injection | Manipulate AI outputs | Crafted website content affecting research |

### Attack Vectors

| Vector | Mitigation |
|--------|------------|
| Cross-tenant data access | RLS + application-level org validation |
| SQL injection | Parameterized queries (Supabase client), no raw SQL in app |
| XSS | React auto-escaping, CSP headers |
| CSRF | SameSite cookies, Supabase Auth token validation |
| Credential stuffing | Supabase Auth rate limiting, MFA (future) |
| API key exposure | Server-side only; never in client bundle |
| Prompt injection | Sanitize crawled content before AI input; structured prompts |
| Unauthorized email sending | Deliverability rules + org-scoped mailbox access |
| Privilege escalation | RBAC enforced at API and RLS level |

---

## Authentication

| Aspect | Implementation |
|--------|----------------|
| Provider | Supabase Auth |
| Methods (v1) | Email/password |
| Methods (future) | SSO (Google, SAML), MFA |
| Session | JWT with custom claims (`org_id`, `role`) |
| Token storage | HttpOnly cookies (not localStorage) |
| Password policy | Minimum 8 characters; Supabase enforcement |
| Session expiry | Configurable; default 7 days with refresh |

---

## Authorization

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Owner** | Full org access; delete org; manage billing (future) |
| **Admin** | Manage members, settings, campaigns, mailboxes |
| **Member** | View data, create campaigns, approve outreach |
| **Viewer** (future) | Read-only access to dashboards and reports |

### Enforcement Points

Authorization is checked at **three levels** (defense in depth):

1. **Database (RLS)** — PostgreSQL policies filter rows by `organization_id` and role
2. **Application** — Server actions and API routes validate permissions before executing
3. **UI** — Components hide actions the user cannot perform (UX only; not security)

Never rely on UI-only authorization.

### RLS Policy Pattern

```sql
-- Every tenant table follows this pattern
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can access their data"
  ON {table} FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );
```

---

## Data Protection

| Control | Detail |
|---------|--------|
| Encryption in transit | TLS 1.2+ on all connections |
| Encryption at rest | Supabase default (AES-256) |
| Secrets management | Environment variables; Vercel/Supabase secret stores |
| PII handling | Business contact data only; no personal email scraping |
| Data retention | Configurable per org; automated cleanup jobs |
| Backup | Supabase managed backups; tested in M9 |

---

## Input Validation

Every external input validated with Zod at system boundaries:

| Boundary | Validated |
|----------|-----------|
| HTTP requests | API routes, server actions |
| Form submissions | React Hook Form + Zod |
| Job payloads | Trigger.dev job handlers |
| Webhook payloads | Supabase Edge Functions |
| AI outputs | Zod schemas before persistence |
| Environment variables | Validated at application startup |
| Crawled content | Sanitized before AI input |

---

## Email Security

| Control | Detail |
|---------|--------|
| Mailbox credentials | Encrypted at rest; never exposed to client |
| Send authorization | User must have campaign permission + mailbox must belong to org |
| Suppression enforcement | Cannot be bypassed by any API or job |
| Unsubscribe tokens | Cryptographically signed; single-use |
| SPF/DKIM/DMARC | Validated before mailbox activation |

---

## AI Security

| Control | Detail |
|---------|--------|
| Prompt injection mitigation | Crawled content sanitized; structured prompt templates |
| Output validation | Zod schemas reject malformed AI responses |
| API key isolation | Keys server-side only; per-environment |
| Cost limits | Token budgets per org (future); alert on anomaly |
| Data sent to AI | Business context only; no user passwords or credentials |
| Provenance tracking | Every AI call logged with input hash and prompt version |

---

## Audit & Monitoring

| Control | Detail |
|---------|--------|
| Audit logs | Immutable; all state changes logged |
| Failed auth attempts | Logged by Supabase Auth |
| Anomaly detection | Alert on unusual send volumes (M9) |
| Error monitoring | Application errors tracked (M9) |
| Dependency scanning | Automated in CI (M0) |

---

## Security Milestones

| Control | Milestone |
|---------|-----------|
| Auth + RBAC | M1 |
| RLS on all tables | M1 |
| Input validation (Zod) | M0 (setup) + M1 (schemas) |
| Audit logging | M1 |
| Email credential encryption | M4 |
| Suppression enforcement | M4 |
| Dependency scanning in CI | M0 |
| CSP headers | M1 |
| Security audit | M9 |
| Penetration testing | M9 |
| MFA | Post-M9 |

---

## Incident Response

| Severity | Definition | Response |
|----------|------------|----------|
| SEV-1 | Active data breach, unauthorized email sending | Immediate: pause campaigns, rotate credentials, notify |
| SEV-2 | Vulnerability discovered, no active exploitation | Fix within 24 hours; deploy hotfix |
| SEV-3 | Low-risk vulnerability, hardening opportunity | Fix in next milestone |

Detailed runbooks will be created in M9.

---

## Related Documents

- [Compliance Overview](../compliance/overview.md)
- [Coding Standards](../development/coding-standards.md)
- [ADR-0004: Supabase as Backend](../architecture/adrs/0004-supabase-as-backend.md)
- [Deployment](../operations/deployment.md)
