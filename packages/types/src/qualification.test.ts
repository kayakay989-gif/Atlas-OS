import { describe, expect, it } from 'vitest'
import { leadScoreResultSchema, outreachSettingsSchema } from './qualification'

describe('leadScoreResultSchema', () => {
  it('accepts a valid score result', () => {
    const result = leadScoreResultSchema.safeParse({
      score: 72,
      status: 'qualified',
      reasoning: 'Strong ICP fit with contact email available.',
      factors: [{ name: 'Research completeness', score: 80, weight: 0.4 }],
    })
    expect(result.success).toBe(true)
  })
})

describe('outreachSettingsSchema', () => {
  it('applies defaults', () => {
    const result = outreachSettingsSchema.parse({})
    expect(result.requireManualApproval).toBe(true)
    expect(result.minQualificationScore).toBe(60)
  })
})
