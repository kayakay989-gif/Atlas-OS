# ADR-0005: Multi-Provider AI Strategy

**Status:** Accepted  
**Date:** 2026-07-17  
**Deciders:** Lead Architect

## Context

AI is core to Atlas Sales OS—used for company research, lead qualification, email personalization, proposal generation, and campaign optimization. Requirements:

- High-quality text generation and analysis
- Structured output (JSON) for pipeline integration
- Cost tracking per organization
- Resilience against provider outages
- Prompt versioning and auditability
- Output validation before persistence

Locking into a single AI provider creates vendor risk and limits cost optimization.

## Decision

Implement a **multi-provider AI gateway** in `packages/ai` with:

### Provider Abstraction

```typescript
interface AIProvider {
  complete(request: AIRequest): Promise<AIResponse>
  completeStructured<T>(request: AIRequest, schema: ZodSchema<T>): Promise<T>
}
```

Implementations: `OpenAIProvider`, `GeminiProvider`.

### Routing Strategy

| Task Type | Primary Provider | Fallback |
|-----------|-----------------|----------|
| Research analysis (long context) | Gemini (large context window) | OpenAI |
| Email generation (creative) | OpenAI | Gemini |
| Lead scoring (structured) | OpenAI | Gemini |
| Proposal generation (long form) | OpenAI | Gemini |

Routing is configurable per task type in organization settings (future).

### Prompt Management

- Prompts stored as versioned Markdown files in `prompts/`
- Prompt builder functions in `packages/ai/src/prompts/` assemble prompts with structured data
- Never pass raw user input as system prompts
- Every prompt execution logged with: prompt version, model, input hash, token count, output

### Output Validation

All AI outputs parsed through Zod schemas before persistence:

```typescript
const emailDraftSchema = z.object({
  subject: z.string().max(200),
  body: z.string().max(5000),
  personalizationNotes: z.string().optional(),
})
```

Invalid outputs trigger retry (once) then flag for human review.

### Cost Tracking

Log per-request: `{ organizationId, taskType, provider, model, inputTokens, outputTokens, costUsd }`

## Consequences

### Positive

- Provider outage doesn't halt the platform
- Can optimize cost by routing tasks to cheaper models
- Prompt versioning enables A/B testing and rollback
- Structured output validation prevents garbage data in the pipeline
- Audit trail for all AI decisions

### Negative

- Abstraction layer adds development overhead
- Different providers may produce different quality for same prompt
- Must test prompts against both providers
- Token cost tracking requires provider-specific pricing tables

### Neutral

- Prompt engineering becomes a first-class discipline (see `prompts/README.md`)
- May add more providers (Anthropic, etc.) behind the same interface later

## Alternatives Considered

| Alternative | Why Not |
|-------------|---------|
| OpenAI only | Vendor lock-in; no fallback on outage |
| Self-hosted models (Llama, etc.) | Quality gap for sales copy; infra overhead |
| LangChain/LangGraph | Heavy abstraction; we need tighter control over prompts and validation |
| Direct API calls everywhere | Duplicated retry/validation/cost logic across jobs |
| Single model for all tasks | Different tasks have different optimal models |
