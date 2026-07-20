# M3 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 3 (Qualification & Outreach Generation).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Phase Tracker

| Phase | Name                                               | Status      |
| ----- | -------------------------------------------------- | ----------- |
| 1     | Database Schema & RLS                              | ✅ Complete |
| 2     | Types, Qualification & Outreach Packages           | ✅ Complete |
| 3     | Pipeline Services & Worker Jobs                    | ✅ Complete |
| 4     | Web UI (Qualification, Outreach Review, Sequences) | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off                     | ✅ Complete |

---

## Acceptance Criteria

- [x] Leads scored automatically after research completes
- [x] User can configure approval requirement (auto vs manual review)
- [x] AI generates personalized email using company research data (mock provider)
- [x] User can review, edit, and approve/reject generated emails
- [x] Sequences support 3+ steps with configurable delays
- [x] Quality check flags emails missing required elements
- [x] Approved emails ready for campaign (not sent — M5)
- [x] All operations scoped to organization
- [x] `pnpm validate` passes

---

## Follow-Up (Post-M3)

- Real OpenAI email generation when `OPENAI_API_KEY` is set
- Org-level feature flag UI from `organization_settings`
- E2E tests for qualification → outreach flow
