import { describe, expect, it } from 'vitest'
import { selectMailboxForSend, getNextRotationIndex } from './services/mailbox-rotation-service'
import { classifyReply, shouldPauseSequenceOnReply } from './services/reply-classifier-service'
import { isWithinSendWindow } from './services/send-scheduler-service'

const mailbox = (id: string, health: number, status: 'active' | 'paused' = 'active') => ({
  id,
  organization_id: 'org-1',
  domain_id: 'domain-1',
  email_address: `${id}@mail.example.com`,
  display_name: null,
  provider: 'google_workspace' as const,
  status,
  daily_send_limit: 50,
  sends_today: 0,
  sends_today_reset_at: '2026-07-20',
  warm_up_started_at: new Date().toISOString(),
  health_score: health,
  bounce_rate_30d: 0,
  complaint_rate_30d: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

describe('mailbox rotation', () => {
  it('rotates through eligible mailboxes', () => {
    const mailboxes = [mailbox('a', 80), mailbox('b', 70)]
    const campaignMailboxes = [
      { mailbox_id: 'a', rotation_order: 0 },
      { mailbox_id: 'b', rotation_order: 1 },
    ]

    expect(selectMailboxForSend(mailboxes, campaignMailboxes, 0)?.id).toBe('a')
    expect(selectMailboxForSend(mailboxes, campaignMailboxes, 1)?.id).toBe('b')
    expect(getNextRotationIndex(1, 2)).toBe(0)
  })

  it('skips unhealthy mailboxes', () => {
    const mailboxes = [mailbox('a', 30), mailbox('b', 80)]
    const campaignMailboxes = [
      { mailbox_id: 'a', rotation_order: 0 },
      { mailbox_id: 'b', rotation_order: 1 },
    ]

    expect(selectMailboxForSend(mailboxes, campaignMailboxes, 0)?.id).toBe('b')
  })
})

describe('reply classifier', () => {
  it('detects unsubscribe intent', () => {
    expect(classifyReply('Please unsubscribe me from this list')).toBe('unsubscribe')
  })

  it('pauses sequence on reply except out of office', () => {
    expect(shouldPauseSequenceOnReply('positive')).toBe(true)
    expect(shouldPauseSequenceOnReply('out_of_office')).toBe(false)
  })
})

describe('send window', () => {
  it('allows sends inside configured window', () => {
    const noonUtc = new Date('2026-07-20T12:00:00.000Z')
    expect(
      isWithinSendWindow(
        { timezone: 'UTC', sendWindowStart: '09:00', sendWindowEnd: '17:00' },
        noonUtc,
      ),
    ).toBe(true)
  })
})
