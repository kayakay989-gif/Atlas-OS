# Operator Guide — Atlas Sales OS

**Version:** 1.0  
**Last Updated:** 2026-07-20

Guide for day-to-day operation of Atlas Sales OS after M9 production hardening.

---

## Getting started

1. Run `pnpm db:reset && pnpm dev`
2. Enable feature flags for the modules you need (see `.env.example`)
3. Sign up, create an organization, and invite team members from **Settings → Team**

---

## Core workflow

| Step              | Where                | Action                       |
| ----------------- | -------------------- | ---------------------------- |
| 1. Discover       | Discovery            | Upload CSV or configure ICP  |
| 2. Qualify        | Qualification        | Review lead scores           |
| 3. Outreach       | Outreach             | Review/approve email drafts  |
| 4. Deliverability | Deliverability       | Verify domains and mailboxes |
| 5. Campaign       | Campaigns            | Launch outbound sequence     |
| 6. Book           | Meetings             | Calendly link in outreach    |
| 7. Convert        | Proposals / Invoices | Generate, approve, send      |
| 8. Optimize       | Analytics            | Run learning analysis        |
| 9. Monitor        | Operations           | Review alerts and usage      |

---

## Feature flags

| Flag                       | Enables                |
| -------------------------- | ---------------------- |
| `FF_DISCOVERY_PIPELINE`    | Discovery & research   |
| `FF_OUTREACH_GENERATION`   | Email draft generation |
| `FF_EMAIL_SENDING`         | Deliverability & send  |
| `FF_CAMPAIGN_EXECUTION`    | Campaign launcher      |
| `FF_MEETING_BOOKING`       | Meetings & Calendly    |
| `FF_CONVERSION_PIPELINE`   | Proposals & invoices   |
| `FF_LEARNING_OPTIMIZATION` | Analytics & A/B tests  |
| `FF_OPS_MONITORING`        | Operations dashboard   |

---

## Booking link

Production Calendly URL: `https://calendly.com/essa-qasim/30min`

Set `NEXT_PUBLIC_BOOKING_URL` to override. Outreach step 1 auto-includes this link.

---

## Monitoring

- **Health:** `GET /health` — deep check (database latency, config)
- **Operations:** `/operations` — alerts, usage, run monitoring check
- **Worker:** `ops-monitor` job evaluates mailbox health and bounce rates

---

## Related docs

- [Runbooks](./runbooks/README.md)
- [Disaster recovery](./disaster-recovery.md)
- [Deployment](./deployment.md)
