# M4 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 4 (Email Infrastructure).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md) · [ADR-0006](../architecture/adrs/0006-email-deliverability-architecture.md)

---

## Phase Tracker

| Phase | Name                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                               | ✅ Complete |
| 2     | Types & `@atlas/deliverability` Package             | ✅ Complete |
| 3     | DNS Validation, Warm-Up & Worker Jobs               | ✅ Complete |
| 4     | Web UI (Domains, Mailboxes, Suppression, Dashboard) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                      | ✅ Complete |

---

## Acceptance Criteria

- [x] User can add a domain and see DNS configuration instructions
- [x] System validates SPF, DKIM, DMARC records
- [x] User can register mailboxes and see warm-up progress
- [x] Warm-up schedule follows ramp (5→10→20→35→50/day)
- [x] Suppression list prevents sends to listed addresses
- [x] Health score computed and displayed per mailbox
- [x] Deliverability rules block sends that fail any check
- [x] All deliverability rules have unit tests
- [x] `pnpm validate` passes

---

## Follow-Up (Post-M4)

- Production DNS resolution (real TXT lookups in worker)
- Google Workspace OAuth for mailbox provisioning
- `send_records` table and actual email dispatch (M5)
- E2E tests for domain → mailbox → pre-send check flow
