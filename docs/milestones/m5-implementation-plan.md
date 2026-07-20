# M5 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 5 (Campaigns & Replies).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Phase Tracker

| Phase | Name                                               | Status      |
| ----- | -------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                              | ✅ Complete |
| 2     | Types & `@atlas/campaigns` Package                 | ✅ Complete |
| 3     | Send Scheduler, Pre-Send Integration & Worker Jobs | ✅ Complete |
| 4     | Web UI (Campaign Builder, Dashboard, Analytics)    | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                     | ✅ Complete |

---

## Acceptance Criteria

- [x] User can create and launch a campaign from qualified leads (approved step-1 drafts)
- [x] Emails sent respecting daily limits, warm-up, and mailbox rotation
- [x] Pre-send checks (ADR-0006) run before every send
- [x] Reply classification pauses follow-up sequences on reply
- [x] Hard bounce / unsubscribe handlers add suppression entries
- [x] Campaign dashboard shows send, reply, and bounce metrics
- [x] Campaign auto-pauses when mailbox health drops below threshold
- [x] `pnpm validate` passes

---

## Follow-Up (Post-M5)

- Real SMTP / Google Workspace send adapter (mock used for M5)
- Inbox polling for reply detection (mock classifier in place)
- Operator notification system for replies
- E2E: launch → send → reply → pause flow
