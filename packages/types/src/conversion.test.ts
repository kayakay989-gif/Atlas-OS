import { describe, expect, it } from 'vitest'
import { createProposalSchema, reviewProposalSchema } from './conversion'

describe('createProposalSchema', () => {
  it('accepts minimal proposal input', () => {
    const result = createProposalSchema.safeParse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })
})

describe('reviewProposalSchema', () => {
  it('requires decision', () => {
    const result = reviewProposalSchema.safeParse({
      proposalId: '550e8400-e29b-41d4-a716-446655440000',
      decision: 'approved',
    })
    expect(result.success).toBe(true)
  })
})
