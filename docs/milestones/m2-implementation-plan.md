# M2 Implementation Plan — Atlas Sales OS

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** 2026-07-20

Phased delivery of Milestone 2 (Discovery & Research Pipeline).

**Source of truth:** [PROJECT_STATE.md](../../PROJECT_STATE.md)

---

## Phase Tracker

| Phase | Name                               | Status      |
| ----- | ---------------------------------- | ----------- |
| 1     | Database Schema & RLS              | ✅ Complete |
| 2     | Types & `@atlas/discovery` Package | ✅ Complete |
| 3     | Pipeline Services & Worker Jobs    | ✅ Complete |
| 4     | Web UI (ICP, Companies, Profiles)  | ✅ Complete |
| 5     | Tests, Feature Flag & Sign-Off     | ✅ Complete |

---

## Acceptance Criteria

- [x] User can create an ICP profile with configurable criteria
- [x] CSV import discovery provider (pluggable architecture)
- [x] Website crawl extracts public page content
- [x] AI research report (branding, UX, positioning, pain points) — mock provider
- [x] Contacts associated with companies
- [x] Company profile page with research + contacts
- [x] Async pipeline with progress indicators (status on company row)
- [x] All operations scoped to organization
- [x] `pnpm validate` passes

---

## Follow-Up (Post-M2)

- Real OpenAI provider when `OPENAI_API_KEY` is set
- Firecrawl and Playwright discovery providers
- E2E tests for full discovery flow
- Org-level feature flag UI (ADR-0012 schema ready)
