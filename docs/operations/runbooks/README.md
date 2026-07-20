# Runbooks — Atlas Sales OS

Incident response playbooks for common failure modes.

---

## Index

| Runbook                                           | When to use                                     |
| ------------------------------------------------- | ----------------------------------------------- |
| [High bounce rate](./high-bounce-rate.md)         | Bounce rate alert or deliverability degradation |
| [Mailbox health low](./mailbox-health-low.md)     | Critical mailbox health alert                   |
| [Database unavailable](./database-unavailable.md) | `/health` returns 503 or app cannot connect     |

---

## General escalation

1. Check `/operations` for open alerts
2. Check `/health` for failing components
3. Review Supabase dashboard logs
4. Acknowledge alert after mitigation started
