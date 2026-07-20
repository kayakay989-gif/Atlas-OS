import { describe, expect, it } from 'vitest'
import { generateAvailableSlots, buildBookingUrl } from './services/availability-service'
import { generateMeetingBriefContent } from './services/brief-generation-service'
import type { PublicBookingContext } from '@atlas/types'

const baseContext: PublicBookingContext = {
  organizationName: 'Atlas',
  timezone: 'UTC',
  slotDurationMinutes: 30,
  minNoticeHours: 0,
  weeklyHours: {
    monday: [{ start: '09:00', end: '12:00' }],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
}

describe('generateAvailableSlots', () => {
  it('generates slots within weekly hours', () => {
    const monday = new Date('2026-07-20T00:00:00.000Z')
    const slots = generateAvailableSlots(baseContext, [], 1, monday)

    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toContain('2026-07-20T09:00:00.000Z')
  })

  it('excludes overlapping meetings', () => {
    const monday = new Date('2026-07-20T00:00:00.000Z')
    const slots = generateAvailableSlots(
      baseContext,
      [
        {
          scheduledStart: new Date('2026-07-20T09:00:00.000Z'),
          scheduledEnd: new Date('2026-07-20T09:30:00.000Z'),
        },
      ],
      1,
      monday,
    )

    expect(slots).not.toContain('2026-07-20T09:00:00.000Z')
  })
})

describe('buildBookingUrl', () => {
  it('builds internal booking path for legacy tokens', () => {
    expect(buildBookingUrl('http://localhost:3000', 'abc123')).toBe(
      'http://localhost:3000/book/abc123',
    )
  })
})

describe('getBookingUrl', () => {
  it('defaults to Calendly production URL', async () => {
    const { getBookingUrl, DEFAULT_BOOKING_URL } = await import('./constants/booking-url')
    delete process.env.NEXT_PUBLIC_BOOKING_URL
    expect(getBookingUrl()).toBe(DEFAULT_BOOKING_URL)
    expect(DEFAULT_BOOKING_URL).toBe('https://calendly.com/essa-qasim/30min')
  })
})

describe('generateMeetingBriefContent', () => {
  it('includes research and reply context', () => {
    const result = generateMeetingBriefContent({
      companyName: 'Acme',
      contactName: 'Jane',
      attendeeName: 'Jane Doe',
      researchSummary: 'Acme is expanding internationally.',
      painPoints: ['Hiring'],
      replySnippets: ["Sounds good, let's talk"],
      scheduledStart: '2026-07-21T10:00:00.000Z',
    })

    expect(result.content).toContain('Acme')
    expect(result.content).toContain('internationally')
    expect(result.content).toContain('Sounds good')
  })
})
