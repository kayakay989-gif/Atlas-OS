import { describe, expect, it } from 'vitest'
import { availabilitySettingsSchema, bookMeetingPublicSchema, weeklyHoursSchema } from './meetings'

describe('weeklyHoursSchema', () => {
  it('accepts standard business hours', () => {
    const result = weeklyHoursSchema.safeParse({
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    })

    expect(result.success).toBe(true)
  })
})

describe('availabilitySettingsSchema', () => {
  it('defaults slot duration', () => {
    const result = availabilitySettingsSchema.parse({
      weeklyHours: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    })

    expect(result.slotDurationMinutes).toBe(30)
  })
})

describe('bookMeetingPublicSchema', () => {
  it('requires attendee details', () => {
    const result = bookMeetingPublicSchema.safeParse({
      token: 'abc',
      attendeeName: 'A',
      attendeeEmail: 'not-an-email',
      scheduledStart: '2026-07-21T10:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})
