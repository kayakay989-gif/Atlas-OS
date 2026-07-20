# M7 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 7 (Proposals & Invoicing).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Phase Tracker

| Phase | Name                                     | Status      |
| ----- | ---------------------------------------- | ----------- |
| 1     | Database Schema & RLS                    | ✅ Complete |
| 2     | Types & `@atlas/conversion` Package      | ✅ Complete |
| 3     | Worker Jobs & Web Actions                | ✅ Complete |
| 4     | Web UI (Proposals, Invoices, Onboarding) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off           | ✅ Complete |

---

## Acceptance Criteria

- [x] AI generates proposal based on meeting notes and company research
- [x] Operator can review, edit, and approve proposal
- [x] Approved proposal sent to contact via email (mock for M7)
- [x] Invoice generated from approved proposal
- [x] Onboarding workflow triggered on deal close (invoice paid)
- [x] All actions logged in audit trail (proposal create/approve/send)
- [x] `pnpm validate` passes

---

## Notes

- Production booking uses Calendly: `https://calendly.com/essa-qasim/30min` (`NEXT_PUBLIC_BOOKING_URL`).
- Enable full conversion flow with `FF_CONVERSION_PIPELINE=true`.
