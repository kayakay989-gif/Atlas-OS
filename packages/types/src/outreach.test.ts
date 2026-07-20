import { describe, expect, it } from 'vitest'
import { emailSequenceSchema, qualityIssueSchema } from './outreach'

describe('emailSequenceSchema', () => {
  it('requires at least three steps', () => {
    const result = emailSequenceSchema.safeParse({
      name: 'Default outreach',
      steps: [
        { stepOrder: 1, delayDays: 0, subjectTemplate: 'Hi', bodyTemplate: 'Hello' },
        { stepOrder: 2, delayDays: 3, subjectTemplate: 'Follow up', bodyTemplate: 'Checking in' },
        { stepOrder: 3, delayDays: 7, subjectTemplate: 'Last note', bodyTemplate: 'Closing loop' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects fewer than three steps', () => {
    const result = emailSequenceSchema.safeParse({
      name: 'Too short',
      steps: [{ stepOrder: 1, delayDays: 0, subjectTemplate: 'Hi', bodyTemplate: 'Hello' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('qualityIssueSchema', () => {
  it('accepts warning and error severities', () => {
    expect(
      qualityIssueSchema.safeParse({
        code: 'missing_contact',
        message: 'No contact email found',
        severity: 'error',
      }).success,
    ).toBe(true)
  })
})
