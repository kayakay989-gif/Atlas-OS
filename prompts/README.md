# Prompt Engineering — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Overview

AI prompts are a core product asset in Atlas Sales OS. They drive company research, lead qualification, email personalization, proposal generation, and campaign optimization. Prompts are treated as **versioned, testable, auditable code**—not ad-hoc strings.

---

## Directory Structure

```
prompts/
├── README.md                   # This file
├── research/                   # Company research prompts
│   └── (created in M2)
├── outreach/                   # Email generation prompts
│   └── (created in M3)
├── qualification/              # Lead scoring prompts
│   └── (created in M3)
├── conversion/                 # Proposal and meeting brief prompts
│   └── (created in M6/M7)
└── evaluation/                 # Sample inputs for prompt testing
    └── (created per milestone)
```

Prompt files are created incrementally as each milestone requires them. Do not pre-write prompts for future milestones.

---

## Prompt File Format

Each prompt is a versioned Markdown file:

```
prompts/{category}/{name}.v{version}.md
```

Example: `prompts/outreach/cold-email.v1.md`

### Template

```markdown
---
name: cold-email
version: 1
category: outreach
model: openai/gpt-4o
taskType: email_generation
inputSchema: outreachEmailInput
outputSchema: emailDraft
---

# System Prompt

You are a B2B sales outreach specialist for {organization_name}.

## Rules
- Write concise, professional emails
- Reference specific details from the company research
- Never fabricate information not present in the research data
- Include a clear call to action
- Do not use spam trigger words: {blocked_words}

## Output Format
Return JSON matching the emailDraft schema.

# User Prompt Template

Company: {company_name}
Industry: {industry}
Research Summary: {research_summary}
Contact: {contact_name}, {contact_title}
Previous Emails: {previous_emails}
Sequence Step: {step_number} of {total_steps}
```

---

## Prompt Engineering Rules

### DO

| Rule | Reason |
|------|--------|
| Ground prompts in structured data | Prevents hallucination; enables validation |
| Version every prompt change | Auditability and rollback |
| Validate all AI output with Zod | Catch malformed responses before persistence |
| Test prompts against both providers | Ensure consistent quality across OpenAI and Gemini |
| Log prompt version with every AI call | Traceability for debugging and optimization |
| Use system + user prompt separation | Clear instruction vs. data boundary |
| Include explicit output format instructions | Structured JSON output |
| Sanitize crawled content before inclusion | Prevent prompt injection from malicious websites |

### DO NOT

| Rule | Reason |
|------|--------|
| Embed prompts as inline strings in code | No versioning, no auditability |
| Pass raw user input as system prompts | Prompt injection risk |
| Trust AI output without validation | Garbage data enters the pipeline |
| Use the same prompt for all providers | Different models respond differently |
| Include secrets or credentials in prompts | Security risk |
| Generate without research context | Low-quality, generic outreach |

---

## Prompt Builder Pattern

Prompts are loaded and assembled by builder functions in `packages/ai/src/prompts/`:

```typescript
// packages/ai/src/prompts/outreach/cold-email.ts
import { readPromptFile } from '../loader'
import type { OutreachEmailInput } from '@atlas/types'

export function buildColdEmailPrompt(input: OutreachEmailInput) {
  const template = readPromptFile('outreach/cold-email.v1.md')

  return {
    system: interpolate(template.system, {
      organization_name: input.organizationName,
      blocked_words: input.blockedWords.join(', '),
    }),
    user: interpolate(template.user, {
      company_name: input.company.name,
      industry: input.company.industry,
      research_summary: input.research.summary,
      contact_name: input.contact.name,
      contact_title: input.contact.title,
      previous_emails: formatPreviousEmails(input.previousEmails),
      step_number: input.sequenceStep,
      total_steps: input.totalSteps,
    }),
    metadata: {
      promptName: 'cold-email',
      promptVersion: 1,
    },
  }
}
```

---

## Versioning

| Change Type | Action |
|-------------|--------|
| Typo fix (no behavior change) | Update in place; note in git commit |
| Behavior change | Increment version: `v1` → `v2`; keep old version |
| Provider change | New version with updated model field |
| Schema change | New version + update Zod output schema |

Old prompt versions are retained for audit and comparison. Never delete prompt files.

---

## Evaluation

Prompts are evaluated using sample inputs in `prompts/evaluation/`:

```
prompts/evaluation/
├── research/
│   ├── sample-companies.json     # Curated test companies
│   └── expected-structure.json   # Expected output schema validation
├── outreach/
│   ├── sample-contexts.json      # Research + contact contexts
│   └── quality-rubric.md         # Human evaluation criteria
```

### Evaluation Process

1. Run prompt against sample inputs
2. Validate output against Zod schema (automated)
3. Review output quality against rubric (manual)
4. Compare across providers (OpenAI vs. Gemini)
5. Document results before promoting prompt version

---

## Prompt Registry

The AI gateway tracks all prompts:

| Field | Description |
|-------|-------------|
| `name` | Prompt identifier |
| `version` | Current active version |
| `category` | research, outreach, qualification, conversion |
| `model` | Preferred model |
| `taskType` | For provider routing |
| `inputSchema` | Zod schema for input validation |
| `outputSchema` | Zod schema for output validation |

Every AI call logs: `{ promptName, promptVersion, model, inputTokens, outputTokens, costUsd, organizationId }`.

---

## Related Documents

- [ADR-0005: Multi-Provider AI Strategy](../docs/architecture/adrs/0005-ai-provider-strategy.md)
- [Coding Standards](../docs/development/coding-standards.md)
- [Testing Strategy](../docs/development/testing-strategy.md)
