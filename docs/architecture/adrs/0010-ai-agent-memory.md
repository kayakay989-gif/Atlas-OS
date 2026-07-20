# ADR-0010: AI Agent Memory Architecture

**Status:** Accepted  
**Date:** 2026-07-19  
**Deciders:** Lead Architect, Product Owner

## Context

Atlas Sales OS is built around autonomous AI workers, not AI as a bolt-on feature. For agents to make increasingly good decisions over time, they need **memory**—persistent context about entities, interactions, and outcomes.

Without memory:

- Every research run starts from scratch
- Outreach ignores previous conversations and website changes
- Qualification cannot learn from past campaign performance
- The platform cannot become progressively more autonomous

## Decision

Design the platform with **long-term agent memory** from the beginning. Memory is implemented progressively across milestones, but the data model and access patterns are designed in M1.

### Memory Categories

| Category | Examples | Used By |
|----------|----------|---------|
| **Entity memory** | Company profile, contacts, website snapshots | Research, Qualification, Outreach agents |
| **Interaction memory** | Emails sent, replies received, meetings held | Outreach, Follow-up, Conversion agents |
| **Decision memory** | AI scores, approval/rejection reasons, human edits | Qualification, Learning agents |
| **Performance memory** | Campaign metrics, A/B results, conversion rates | Learning, Optimization agents |
| **Temporal memory** | Website changes over time, contact role changes | Research, Re-qualification agents |
| **Scheduled memory** | Future follow-ups, re-research triggers | Scheduler agents |

### Memory Access Pattern

Agents access memory through a unified **Memory Gateway** (`packages/ai/src/memory/`), not direct database queries:

```typescript
interface MemoryGateway {
  getCompanyContext(companyId: string, orgId: string): Promise<CompanyMemory>
  getContactHistory(contactId: string, orgId: string): Promise<InteractionMemory[]>
  getCampaignPerformance(campaignId: string, orgId: string): Promise<PerformanceMemory>
  getWebsiteHistory(companyId: string, orgId: string): Promise<WebsiteSnapshot[]>
  recordDecision(decision: AgentDecision): Promise<void>
  scheduleFutureAction(action: ScheduledMemory): Promise<void>
}
```

### Memory Storage (Progressive Implementation)

| Memory Type | Storage | Milestone |
|-------------|---------|-----------|
| Company & contact records | PostgreSQL core tables | M1 |
| Website snapshots | PostgreSQL + Supabase Storage | M2 |
| Outreach history | PostgreSQL (`send_records`, `inbound_messages`) | M5 |
| AI decisions | PostgreSQL (`agent_decisions`) | M3 |
| Campaign performance | PostgreSQL + materialized views | M5 |
| Website change detection | PostgreSQL (`website_snapshots` diff) | M2 |
| Scheduled follow-ups | PostgreSQL + job queue | M5 |
| Semantic search over memory | pgvector embeddings (future) | M8 |

### Agent Decision Record

Every AI decision is persisted for audit and learning:

```typescript
interface AgentDecision {
  id: string
  organizationId: string
  agentType: 'research' | 'qualification' | 'outreach' | 'learning'
  entityType: string
  entityId: string
  input: Record<string, unknown>    // Structured input (not raw prompts)
  output: Record<string, unknown>   // Validated output
  promptVersion: string
  model: string
  confidence?: number
  humanOverride?: boolean
  createdAt: string
}
```

### Progressive Autonomy Model

Each agent follows this maturity path:

```
Level 0: Manual     → Human performs action
Level 1: Assisted   → AI suggests; human executes
Level 2: Supervised → AI executes; human approves
Level 3: Autonomous → AI executes within guardrails
Level 4: Learning   → AI executes and improves from memory
```

Organization settings configure the autonomy level per agent type. Default: Level 2 (supervised) for outreach; Level 3 for research.

### Memory in Prompts

Prompt builders pull relevant memory context automatically:

```typescript
const context = await memory.getCompanyContext(companyId, orgId)
const prompt = buildOutreachPrompt({
  company: context.company,
  research: context.latestResearch,
  previousEmails: context.interactionHistory,
  websiteChanges: context.recentWebsiteChanges,
  campaignPerformance: context.similarCampaignResults,
})
```

Agents never receive raw database rows—they receive curated, structured memory context.

## Consequences

### Positive

- Platform becomes smarter over time without manual reconfiguration
- AI decisions are auditable and explainable
- Human edits feed back into future agent behavior
- Competitive moat: proprietary memory improves with usage
- Supports progressive autonomy (Level 0 → Level 4)

### Negative

- Memory storage grows over time; retention policies needed
- Memory gateway adds abstraction layer
- pgvector/semantic search adds complexity in M8
- Must carefully scope memory context to avoid token limit issues in prompts

### Neutral

- Core tables designed in M1; memory features ship progressively
- Memory gateway interface defined early; implementations added per milestone

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| Stateless AI (no memory) | Every interaction starts fresh; no learning; not competitive |
| External memory SaaS (Mem0, etc.) | Third-party dependency; data sovereignty concerns |
| Full RAG from day one | Over-engineered for M1; progressive approach better |
| Memory only in prompts (no persistence) | Lost on restart; not auditable |
