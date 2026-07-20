import { z } from 'zod'
import { organizationIdSchema } from './common'

export const calendarProviderSchema = z.enum(['google_calendar'])

export type CalendarProvider = z.infer<typeof calendarProviderSchema>

export const calendarConnectionStatusSchema = z.enum(['pending', 'connected', 'disconnected'])

export type CalendarConnectionStatus = z.infer<typeof calendarConnectionStatusSchema>

export const meetingStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
])

export type MeetingStatus = z.infer<typeof meetingStatusSchema>

export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

export const timeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

export type TimeRange = z.infer<typeof timeRangeSchema>

export const weeklyHoursSchema = z.record(dayOfWeekSchema, z.array(timeRangeSchema))

export type WeeklyHours = z.infer<typeof weeklyHoursSchema>

export const availabilitySettingsSchema = z.object({
  timezone: z.string().trim().min(1).max(64).default('UTC'),
  slotDurationMinutes: z.number().int().min(15).max(120).default(30),
  minNoticeHours: z.number().int().min(0).max(168).default(24),
  bufferMinutes: z.number().int().min(0).max(60).default(0),
  weeklyHours: weeklyHoursSchema,
})

export type AvailabilitySettingsInput = z.infer<typeof availabilitySettingsSchema>

export const connectCalendarSchema = z.object({
  externalAccountEmail: z.string().email(),
  provider: calendarProviderSchema.default('google_calendar'),
})

export type ConnectCalendarInput = z.infer<typeof connectCalendarSchema>

export const createBookingLinkSchema = z.object({
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  label: z.string().trim().max(120).optional(),
})

export type CreateBookingLinkInput = z.infer<typeof createBookingLinkSchema>

export const bookMeetingPublicSchema = z.object({
  token: z.string().min(16),
  attendeeName: z.string().trim().min(2).max(120),
  attendeeEmail: z.string().email(),
  scheduledStart: z.string().datetime(),
})

export type BookMeetingPublicInput = z.infer<typeof bookMeetingPublicSchema>

export const publicBookingContextSchema = z.object({
  organizationName: z.string(),
  timezone: z.string(),
  slotDurationMinutes: z.number().int(),
  minNoticeHours: z.number().int(),
  weeklyHours: weeklyHoursSchema,
  contactName: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
})

export type PublicBookingContext = z.infer<typeof publicBookingContextSchema>

export const meetingBriefGenerateJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  meetingId: z.string().uuid(),
})

export type MeetingBriefGenerateJobPayload = z.infer<typeof meetingBriefGenerateJobPayloadSchema>
