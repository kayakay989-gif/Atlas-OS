import { describe, expect, it } from 'vitest'
import { createExperimentSchema, reviewRecommendationSchema } from './learning'

describe('createExperimentSchema', () => {
  it('requires at least two variants', () => {
    const result = createExperimentSchema.safeParse({
      name: 'Subject test',
      experimentType: 'subject_line',
      variants: [
        { label: 'A', subjectPattern: 'Quick question' },
        { label: 'B', subjectPattern: 'Idea for' },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('reviewRecommendationSchema', () => {
  it('accepts decision', () => {
    const result = reviewRecommendationSchema.safeParse({
      recommendationId: '550e8400-e29b-41d4-a716-446655440000',
      decision: 'accepted',
    })
    expect(result.success).toBe(true)
  })
})
