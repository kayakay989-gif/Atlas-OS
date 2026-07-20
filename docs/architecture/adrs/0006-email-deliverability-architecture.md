# ADR-0006: Email Deliverability Architecture

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect, Product Owner

## Context

Email deliverability is not a feature—it is a **core platform capability**. Atlas Sales OS sends outbound sales emails at scale. Poor deliverability means:

- Emails land in spam → campaigns fail
- Domain reputation damage → affects all future sends
- Blacklisting → platform becomes unusable
- Legal exposure → CAN-SPAM, GDPR, CASL violations

Deliverability must be designed into the architecture from day one, not retrofitted after M4.

## Decision

Treat email deliverability as a **first-class bounded context** with its own entities, rules, and monitoring.

### Core Entities

| Entity | Purpose |
|--------|---------|
| `Domain` | Outreach domain with DNS records (SPF, DKIM, DMARC) |
| `Mailbox` | Individual sending mailbox with warm-up state and daily limits |
| `SuppressionEntry` | Email addresses that must never receive mail |
| `HealthScore` | Computed mailbox/domain reputation score |
| `SendRecord` | Audit trail of every email sent |

### Deliverability Rules (Enforced at Send Time)

Every email must pass these checks before sending:

1. **Suppression list** — Recipient not on global or campaign suppression list
2. **Daily limit** — Mailbox has not exceeded daily send limit
3. **Domain health** — Domain health score above minimum threshold
4. **Mailbox warm-up** — Mailbox is fully warmed or within warm-up daily limits
5. **Unsubscribe link** — Email body contains valid unsubscribe URL
6. **From address** — From address matches registered mailbox
7. **Content check** — No known spam trigger patterns (configurable)
8. **Bounce history** — Recipient domain has not exceeded bounce rate threshold

Failure of any check → email queued for retry or flagged for review. Never silently skip checks.

### Mailbox Warm-Up

New mailboxes follow a configurable warm-up schedule:

```
Day 1–3:   5 emails/day
Day 4–7:   10 emails/day
Day 8–14:  20 emails/day
Day 15–21: 35 emails/day
Day 22+:   Full limit (configurable, default 50/day)
```

Warm-up sends use a dedicated low-priority queue. Warm-up emails are real emails to real contacts (not self-sends).

### Mailbox Rotation

When a campaign sends to N recipients:

1. Query available mailboxes (warmed, under daily limit, healthy)
2. Distribute sends round-robin across available mailboxes
3. Track per-mailbox send count; stop assigning when limit reached
4. If no mailboxes available → pause campaign, notify operator

### Bounce Handling

| Bounce Type | Action |
|-------------|--------|
| Hard bounce | Add to suppression list immediately; update mailbox health |
| Soft bounce | Retry once after 24h; suppress after 3 soft bounces |
| Spam complaint | Add to suppression list; reduce mailbox health score; alert operator |
| Unsubscribe | Add to suppression list; stop all sequences for contact |

### Health Scoring

Mailbox health score (0–100) computed from:

- Bounce rate (last 30 days)
- Spam complaint rate (last 30 days)
- Send volume vs. limit ratio
- Domain DNS configuration completeness
- Warm-up completion status

Score below 50 → mailbox removed from rotation. Score below 30 → campaign auto-pause.

### Email Provider Strategy

| Email Type | Provider |
|------------|----------|
| Outbound sales emails | Google Workspace / SMTP (full mailbox control) |
| Transactional (password reset, notifications) | Resend |
| System alerts | Resend |

Outbound and transactional email use separate domains and infrastructure.

## Consequences

### Positive

- Sender reputation protected by design
- Compliance requirements (unsubscribe, suppression) enforced automatically
- Operators have visibility into deliverability health
- Campaign auto-pause prevents reputation damage
- Audit trail for every send decision

### Negative

- Significant complexity before first email is sent
- Warm-up period delays full campaign volume by 3+ weeks per mailbox
- Multiple mailboxes required for meaningful volume
- DNS configuration requires user action (SPF, DKIM, DMARC)

### Neutral

- Deliverability dashboard is a major UI component in M4
- Google Workspace API integration requires OAuth setup

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Send all email via Resend | Resend is for transactional; outbound sales needs dedicated mailboxes for reputation isolation |
| No warm-up (send immediately) | Guaranteed deliverability damage |
| Single shared mailbox | Single point of failure; no rotation; low daily limits |
| Third-party warm-up service | Adds cost and dependency; we can warm up with real campaign sends |
| Skip deliverability checks initially | Technical debt that causes irreversible reputation damage |
