# Compliance Overview — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Philosophy

Atlas Sales OS is designed for **responsible outbound sales**. Compliance is not a checkbox—it is a core architectural concern. The platform gives operators the tools to configure outreach policies that align with applicable regulations, rather than assuming unrestricted contact.

We build compliance **into** the platform:

- Audit logs for every action
- Suppression lists enforced at send time
- Unsubscribe handling built into every email
- Configurable outreach rules per organization
- Consent tracking where applicable
- Contact history preserved for accountability

---

## Regulatory Framework

Atlas Sales OS supports configurable compliance with major outbound email and data privacy regulations. The platform provides tooling; **legal compliance is the operator's responsibility** based on their jurisdiction, data sources, and outreach practices.

| Regulation | Jurisdiction | Key Requirements | Platform Support |
|------------|-------------|------------------|------------------|
| CAN-SPAM | United States | Unsubscribe link, physical address, honest subject lines, honor opt-outs within 10 days | Unsubscribe link injection, suppression lists, audit logs |
| GDPR | European Union | Lawful basis for processing, data subject rights, consent, data minimization | Consent tracking, data export, deletion requests, audit logs |
| CASL | Canada | Express or implied consent, identification, unsubscribe mechanism | Consent tracking, suppression lists, sender identification |
| PECR | United Kingdom | Similar to GDPR for electronic marketing | Consent tracking, unsubscribe, audit logs |

See [Email Regulations](./email-regulations.md) for detailed guidance.

---

## Compliance Architecture

### Built-In Controls

```
┌─────────────────────────────────────────────────────────┐
│  Compliance Layer                                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Suppression  │  │ Consent      │  │ Outreach     │  │
│  │ Lists        │  │ Tracking     │  │ Rules Engine │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│  ┌──────┴─────────────────┴─────────────────┴───────┐  │
│  │              Send-Time Enforcement                 │  │
│  │  (Every email checked before send)                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Audit Logs   │  │ Contact      │  │ Unsubscribe  │  │
│  │ (immutable)  │  │ History      │  │ Management   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Handling Principles

| Principle | Implementation |
|-----------|----------------|
| **Public data only** | Contact discovery limited to publicly available business information |
| **Purpose limitation** | Data collected for outreach; not repurposed without consent |
| **Data minimization** | Store only what's needed for the sales workflow |
| **Retention limits** | Configurable data retention per organization |
| **Right to deletion** | Contacts can be deleted; suppression persists |
| **Auditability** | Every data access and modification logged |

---

## Suppression Lists

Suppression is enforced at send time and cannot be bypassed.

| Suppression Type | Trigger | Scope |
|------------------|---------|-------|
| Global | Manual add, hard bounce, spam complaint, unsubscribe | Organization-wide |
| Campaign | Manual add, campaign-specific unsubscribe | Single campaign |
| Automatic (hard bounce) | Email hard bounce detected | Global |
| Automatic (spam complaint) | Spam complaint received | Global |
| Automatic (unsubscribe) | Unsubscribe link clicked | Global |

Once suppressed, an address cannot receive email until explicitly removed by an admin (with audit log entry).

---

## Consent Tracking

For jurisdictions requiring consent (CASL, GDPR):

| Consent Type | Storage | Usage |
|--------------|---------|-------|
| Express consent | `consent_records` table with timestamp, source, method | Required before first outreach in strict mode |
| Implied consent | Existing business relationship documented | Configurable per org policy |
| Consent withdrawal | Treated as unsubscribe + suppression | Immediate effect |

Organizations configure their consent requirements in compliance settings.

---

## Audit Logs

Every state-changing operation is logged immutably:

| Field | Description |
|-------|-------------|
| `id` | Unique log entry ID |
| `organization_id` | Tenant scope |
| `user_id` | Who performed the action (null for system actions) |
| `action` | What happened (e.g., `campaign.created`, `email.sent`, `contact.suppressed`) |
| `resource_type` | Entity type affected |
| `resource_id` | Entity ID affected |
| `metadata` | JSON with relevant context (no PII in metadata) |
| `ip_address` | Request IP (for user actions) |
| `created_at` | Timestamp (immutable) |

Audit logs are append-only. No updates or deletes permitted.

---

## Configurable Outreach Rules

Organizations configure their outreach policies:

| Setting | Options | Default |
|---------|---------|---------|
| Consent required before first email | Yes / No | Yes |
| Auto-send vs. manual approval | Auto / Manual / Hybrid | Manual |
| Maximum emails per contact per campaign | 1–10 | 5 |
| Minimum days between emails | 1–30 | 3 |
| Required email elements | Unsubscribe, physical address, sender identification | All enabled |
| Allowed data sources | Configurable list | Public websites only |
| Geographic restrictions | Allowed/blocked countries | None |
| Industry restrictions | Allowed/blocked industries | None |

---

## Data Subject Rights (GDPR)

| Right | Platform Support |
|-------|-----------------|
| Right to access | Export contact data via API/dashboard |
| Right to rectification | Edit contact information |
| Right to erasure | Delete contact (suppression entry persists) |
| Right to restrict processing | Suppress contact (no further outreach) |
| Right to data portability | Export in JSON/CSV format |
| Right to object | Unsubscribe + suppression |

---

## Responsible Crawling

| Rule | Enforcement |
|------|-------------|
| Respect robots.txt | Checked before every crawl |
| Rate limiting | Configurable requests per domain per minute |
| Public pages only | No login-required or paywalled content |
| No personal data scraping | Business contact info only; no personal emails |
| Terms of service | User configures allowed sources; platform warns on risky sources |
| Crawl audit | Every crawl logged with URL, timestamp, response status |

---

## Compliance Milestones

Compliance features are built progressively, not deferred:

| Feature | Milestone |
|---------|-----------|
| Audit logging | M1 |
| Suppression lists | M4 |
| Unsubscribe handling | M4 |
| Consent tracking | M4 |
| Outreach rules configuration | M4 |
| Data export/deletion | M5 |
| Compliance dashboard | M5 |
| Full regulatory documentation | M9 |

---

## Related Documents

- [Email Regulations](./email-regulations.md)
- [Security Overview](../security/overview.md)
- [ADR-0006: Email Deliverability](../architecture/adrs/0006-email-deliverability-architecture.md)
- [Product Charter](../product/charter.md)
