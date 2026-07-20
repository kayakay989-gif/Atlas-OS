import { describe, expect, it } from 'vitest'
import { createCampaignSchema, replyIntentSchema } from './campaign'

describe('createCampaignSchema', () => {
  it('accepts valid campaign input', () => {
    const result = createCampaignSchema.safeParse({
      name: 'Q3 Outbound',
      sequenceId: '550e8400-e29b-41d4-a716-446655440000',
      mailboxIds: ['660e8400-e29b-41d4-a716-446655440001'],
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty mailbox list', () => {
    const result = createCampaignSchema.safeParse({
      name: 'Q3 Outbound',
      sequenceId: '550e8400-e29b-41d4-a716-446655440000',
      mailboxIds: [],
    })

    expect(result.success).toBe(false)
  })
})

describe('replyIntentSchema', () => {
  it('includes unsubscribe intent', () => {
    expect(replyIntentSchema.parse('unsubscribe')).toBe('unsubscribe')
  })
})
