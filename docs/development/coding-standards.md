# Coding Standards — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Philosophy

Code should be **explicit, readable, and correct**. We optimize for long-term maintainability and commercial viability—not implementation speed or cleverness.

| Priority | Over |
|----------|------|
| Product quality | Implementation speed |
| Maintainability | Cleverness |
| Explicit code | Magic / implicit behavior |
| Small, focused modules | Large god files |
| Reusable components | Copy-paste |
| Documented decisions | Tribal knowledge |

### Vendor Abstraction Rule

**Never import third-party SDKs in business logic.** All external services are accessed through internal packages:

| Service | Internal Package | Vendor SDK Allowed In |
|---------|------------------|----------------------|
| Jobs | `@atlas/jobs` | `apps/worker/src/adapters/` only |
| AI | `@atlas/ai` | `packages/ai/src/providers/` only |
| Email | `@atlas/email` | `packages/email/src/adapters/` only |
| Discovery | `@atlas/providers` | `packages/providers/src/adapters/` only |
| Database | `@atlas/database` | `packages/database/` only |

Before adding any new third-party dependency, apply [ADR-0008](../architecture/adrs/0008-build-vs-buy-policy.md).

---

## TypeScript

### Strict Mode

TypeScript strict mode is enabled project-wide. No exceptions.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Rules

| Rule | Example |
|------|---------|
| No `any` | Use `unknown` and narrow with type guards |
| No `@ts-ignore` | Fix the type error; use `@ts-expect-error` with comment if truly unavoidable |
| Prefer `interface` for object shapes | `interface Campaign { ... }` |
| Prefer `type` for unions and computed types | `type CampaignStatus = 'draft' \| 'active' \| 'paused'` |
| Use Zod for runtime validation | `const campaignSchema = z.object({ ... })` |
| Infer types from Zod schemas | `type Campaign = z.infer<typeof campaignSchema>` |
| Explicit return types on exported functions | `export function getCampaign(id: string): Promise<Campaign>` |

### Naming

| Item | Convention | Example |
|------|------------|---------|
| Variables, functions | camelCase | `getCampaignById` |
| Types, interfaces, components | PascalCase | `CampaignList`, `CampaignStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_DAILY_SENDS` |
| Files (components) | PascalCase | `CampaignList.tsx` |
| Files (utilities) | kebab-case | `format-date.ts` |
| Database tables/columns | snake_case | `campaign_contacts`, `organization_id` |
| Environment variables | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY` |
| Event names | dot.notation | `company.discovered` |

---

## React & Next.js

### Component Rules

```typescript
// ✅ Server Component by default
export default async function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaign(params.id)
  return <CampaignDetail campaign={campaign} />
}

// ✅ Client Component only when needed
'use client'
export function CampaignActions({ campaignId }: { campaignId: string }) {
  const [isPaused, setIsPaused] = useState(false)
  // ...
}
```

| Rule | Detail |
|------|--------|
| Server Components by default | Only add `'use client'` when hooks, events, or browser APIs are needed |
| Colocate feature components | `components/features/campaigns/CampaignList.tsx` |
| Props interface above component | Named `{ComponentName}Props` |
| No business logic in components | Extract to hooks (`useCampaign`) or server functions |
| No inline styles | Use Tailwind CSS classes |
| Accessible by default | Use shadcn/ui components; add ARIA labels where needed |

### Data Fetching

| Context | Pattern |
|---------|---------|
| Server Components | Direct database queries via `packages/database` |
| Client Components | Supabase client for realtime; server actions for mutations |
| Background jobs | Direct database queries via `packages/database` |

Never fetch data in `useEffect` when a Server Component can fetch it at render time.

### State Management

| State Type | Tool |
|------------|------|
| Server state | Server Components + Supabase |
| Client UI state | `useState`, `useReducer` |
| Shared client state | Zustand stores in `stores/` |
| Form state | React Hook Form |
| URL state | Next.js `searchParams` |

Do not use Zustand for server data. Do not use React Context for frequently changing state.

---

## Database & Supabase

### Query Patterns

```typescript
// ✅ Typed query with org scoping
export async function getCampaigns(orgId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw new DatabaseError('Failed to fetch campaigns', error)
  return data
}

// ❌ Never query without org scope
export async function getCampaignsBad() {
  const { data } = await supabase.from('campaigns').select('*')
  return data // Returns ALL orgs' data
}
```

### Migration Rules

- One logical change per migration file
- Always include `organization_id` on tenant-scoped tables
- Always enable RLS: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- Always create RLS policies in the same migration
- Include `created_at` and `updated_at` timestamps
- Use UUIDs for primary keys: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- Add indexes for foreign keys and frequently queried columns

---

## Validation

Every external input boundary validates with Zod:

```typescript
// packages/types/src/campaign.ts
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  icpProfileId: z.string().uuid(),
  sequenceId: z.string().uuid(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
```

Boundaries that require validation:

- API route handlers
- Server actions
- Form submissions
- Trigger.dev job payloads
- AI output parsing
- Webhook payloads
- Environment variables (at startup)

---

## Error Handling

### Error Hierarchy

```typescript
// packages/shared/src/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}
```

### Rules

| Rule | Detail |
|------|--------|
| Never swallow errors | Always log and re-throw or return error response |
| User-facing messages | Generic ("Something went wrong"); never expose stack traces |
| Log full context | Include `organizationId`, resource IDs, operation name |
| Fail closed on auth | If authorization check fails, deny access (never default to allow) |
| Idempotent operations | Retry-safe; check state before acting |

---

## Background Jobs (Trigger.dev)

```typescript
// apps/worker/src/jobs/research/research-company.ts
import { task } from '@trigger.dev/sdk/v3'
import { researchCompanySchema } from '@atlas/types'

export const researchCompany = task({
  id: 'research-company',
  retry: { maxAttempts: 3, factor: 2 },
  run: async (payload: unknown) => {
    const input = researchCompanySchema.parse(payload)
    // Validate org access
    // Execute research
    // Emit domain event
  },
})
```

| Rule | Detail |
|------|--------|
| Validate payload with Zod | First line of every job handler |
| Validate org access | Every job checks `organizationId` before DB access |
| Emit events on completion | Use outbox pattern, not direct calls to other jobs |
| Idempotent | Check if work already done before executing |
| Log progress | Use Trigger.dev's built-in logging |
| Set appropriate timeouts | Research: 5 min; Send: 30 sec; Analytics: 2 min |

---

## AI & Prompts

| Rule | Detail |
|------|--------|
| Prompts in `prompts/` directory | Versioned Markdown files, not inline strings |
| Prompt builders in `packages/ai` | Functions that assemble prompts with structured data |
| Validate all AI output | Zod schema parsing before persistence |
| Log AI calls | Model, tokens, cost, prompt version |
| Never trust AI output | Treat as draft until validated and optionally approved |
| Ground in data | Include research context in every generation prompt |

---

## Security

| Rule | Detail |
|------|--------|
| No secrets in code | Environment variables only |
| No secrets in client | API keys server-side only |
| RLS on every tenant table | Defense in depth with application-level checks |
| Validate org on every request | Never trust client-provided org ID without auth check |
| Sanitize user input | Zod validation + parameterized queries |
| Audit log state changes | Every create/update/delete on business entities |
| Principle of least privilege | Default role has minimum permissions |

---

## Imports

```typescript
// Order: external → internal packages → relative
import { z } from 'zod'
import { useState } from 'react'

import { campaignSchema } from '@atlas/types'
import { getCampaigns } from '@atlas/database'

import { CampaignCard } from './CampaignCard'
```

- Use `@atlas/*` path aliases for internal packages
- No default exports except for Next.js pages and components
- Barrel exports (`index.ts`) at package boundaries only

---

## Comments

```typescript
// ✅ Explain non-obvious business logic
// CAN-SPAM requires unsubscribe link in every commercial email.
// We inject it before the deliverability check runs.
function injectUnsubscribeLink(body: string, token: string): string { ... }

// ❌ Don't narrate what the code does
// Get the campaign by ID
const campaign = await getCampaign(id)
```

Write self-documenting code. Comment only when the **why** is not obvious from the code itself.

---

## File Size Limits

| File Type | Soft Limit |
|-----------|------------|
| Component | 200 lines |
| Hook | 100 lines |
| Utility | 50 lines |
| Job handler | 150 lines |
| Test file | 300 lines |

If a file exceeds these limits, extract into smaller modules.

---

## Linting & Formatting

Enforced via CI (configured in Milestone 0):

| Tool | Purpose |
|------|---------|
| ESLint | Code quality rules |
| Prettier | Code formatting |
| TypeScript | Type checking |
| lint-staged | Pre-commit checks on changed files |

Do not disable lint rules without team discussion and a comment explaining why.

---

## Related Documents

- [Development Workflow](./workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Architecture Overview](../architecture/overview.md)
- [Folder Structure](../architecture/folder-structure.md)
