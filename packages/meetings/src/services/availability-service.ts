import type { DayOfWeek, PublicBookingContext, TimeRange, WeeklyHours } from '@atlas/types'

const DAY_KEYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export interface ExistingMeetingSlot {
  scheduledStart: Date
  scheduledEnd: Date
}

export function getDayKey(date: Date): DayOfWeek {
  return DAY_KEYS[date.getUTCDay()] ?? 'monday'
}

export function generateAvailableSlots(
  context: Pick<
    PublicBookingContext,
    'timezone' | 'slotDurationMinutes' | 'minNoticeHours' | 'weeklyHours'
  >,
  existingMeetings: readonly ExistingMeetingSlot[],
  daysAhead = 14,
  now = new Date(),
): string[] {
  const slots: string[] = []
  const minStart = new Date(now.getTime() + context.minNoticeHours * 60 * 60 * 1000)

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset),
    )
    const dayKey = getDayKey(day)
    const ranges = context.weeklyHours[dayKey] ?? []

    for (const range of ranges) {
      slots.push(
        ...generateSlotsForRange(
          day,
          range,
          context.slotDurationMinutes,
          minStart,
          existingMeetings,
        ),
      )
    }
  }

  return slots.sort()
}

function generateSlotsForRange(
  day: Date,
  range: TimeRange,
  slotDurationMinutes: number,
  minStart: Date,
  existingMeetings: readonly ExistingMeetingSlot[],
): string[] {
  const [startHour, startMinute] = range.start.split(':').map(Number)
  const [endHour, endMinute] = range.end.split(':').map(Number)

  const rangeStart = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), startHour, startMinute),
  )
  const rangeEnd = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), endHour, endMinute),
  )

  const slots: string[] = []
  let cursor = new Date(rangeStart)

  while (cursor.getTime() + slotDurationMinutes * 60 * 1000 <= rangeEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60 * 1000)

    if (cursor >= minStart && !overlapsExisting(cursor, slotEnd, existingMeetings)) {
      slots.push(cursor.toISOString())
    }

    cursor = slotEnd
  }

  return slots
}

function overlapsExisting(
  start: Date,
  end: Date,
  existingMeetings: readonly ExistingMeetingSlot[],
): boolean {
  return existingMeetings.some((meeting) => {
    return start < meeting.scheduledEnd && end > meeting.scheduledStart
  })
}

export function buildBookingUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/book/${token}`
}

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
}
