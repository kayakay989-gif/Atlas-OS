# M6 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 6 (Meeting Booking).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Phase Tracker

| Phase | Name                                              | Status      |
| ----- | ------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                             | ✅ Complete |
| 2     | Types & `@atlas/meetings` Package                 | ✅ Complete |
| 3     | Public Booking RPC, Brief Generation & Worker Job | ✅ Complete |
| 4     | Web UI (Settings, Dashboard, Public Booking Page) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                    | ✅ Complete |

---

## Acceptance Criteria

- [x] Operator connects calendar and sets availability
- [x] Booking link embeddable in outreach emails (`{{booking_link}}`)
- [x] Lead can book a meeting from the link
- [x] Both parties receive confirmation (mock for M6)
- [x] Pre-meeting brief generated with company research and conversation history
- [x] Meeting appears in operator's dashboard
- [x] `pnpm validate` passes

---

## Follow-Up (Post-M6)

- Real Google Calendar OAuth and event creation
- Email notifications for confirmations (Resend/SMTP)
- OpenAI-generated briefs when `OPENAI_API_KEY` is set
- E2E: reply → book → brief flow
