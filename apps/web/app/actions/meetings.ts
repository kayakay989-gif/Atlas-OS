'use server'

import { isFeatureEnabled } from '@atlas/config'
import {
  bookMeetingPublic,
  buildBookingUrl,
  connectCalendar,
  createBookingLink,
  DEFAULT_WEEKLY_HOURS,
  generateMeetingBrief,
  getOrCreateAvailabilitySettings,
  sendMeetingConfirmations,
  updateAvailabilitySettings,
} from '@atlas/meetings'
import {
  availabilitySettingsSchema,
  bookMeetingPublicSchema,
  connectCalendarSchema,
  createBookingLinkSchema,
} from '@atlas/types'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface MeetingActionState {
  error?: string
  success?: string
  bookingUrl?: string
  meetingId?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertMeetingsEnabled(organizationId: string): void {
  if (!isFeatureEnabled('meetingBooking', { organizationId })) {
    throw new Error('Meeting booking is disabled. Set FF_MEETING_BOOKING=true to enable.')
  }
}

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export async function connectCalendarAction(
  _prev: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState> {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  assertMeetingsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can connect calendars' }
  }

  const parsed = connectCalendarSchema.safeParse({
    externalAccountEmail: getFormString(formData, 'externalAccountEmail'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid calendar input' }
  }

  const supabase = await createClient()

  try {
    await connectCalendar(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
      userId: user.id,
    })

    revalidatePath('/settings/meetings')
    return { success: 'Google Calendar connected (mock integration for M6)' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to connect calendar' }
  }
}

export async function updateAvailabilityAction(
  _prev: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertMeetingsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can update availability' }
  }

  const parsed = availabilitySettingsSchema.safeParse({
    timezone: getFormString(formData, 'timezone') || 'UTC',
    slotDurationMinutes: Number(getFormString(formData, 'slotDurationMinutes') || '30'),
    minNoticeHours: Number(getFormString(formData, 'minNoticeHours') || '24'),
    bufferMinutes: Number(getFormString(formData, 'bufferMinutes') || '0'),
    weeklyHours: DEFAULT_WEEKLY_HOURS,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid availability settings' }
  }

  const supabase = await createClient()

  try {
    await updateAvailabilitySettings(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
    })

    revalidatePath('/settings/meetings')
    return { success: 'Availability saved' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to save availability' }
  }
}

export async function createBookingLinkAction(
  _prev: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState> {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  assertMeetingsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can create booking links' }
  }

  const companyId = getFormString(formData, 'companyId')
  const contactId = getFormString(formData, 'contactId')

  const parsed = createBookingLinkSchema.safeParse({
    label: getFormString(formData, 'label') || undefined,
    companyId: companyId || undefined,
    contactId: contactId || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid booking link input' }
  }

  const supabase = await createClient()

  try {
    const { token } = await createBookingLink(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
      createdBy: user.id,
    })

    const bookingUrl = buildBookingUrl(getAppBaseUrl(), token)
    revalidatePath('/settings/meetings')
    return {
      success: 'Booking link created. Embed {{booking_link}} in outreach emails.',
      bookingUrl,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create booking link' }
  }
}

export async function bookMeetingPublicAction(
  _prev: MeetingActionState,
  formData: FormData,
): Promise<MeetingActionState> {
  const parsed = bookMeetingPublicSchema.safeParse({
    token: getFormString(formData, 'token'),
    attendeeName: getFormString(formData, 'attendeeName'),
    attendeeEmail: getFormString(formData, 'attendeeEmail'),
    scheduledStart: getFormString(formData, 'scheduledStart'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid booking request' }
  }

  const supabase = await createClient()

  try {
    const meetingId = await bookMeetingPublic(supabase, parsed.data)

    after(async () => {
      try {
        const serviceClient = createServiceClient()
        const { data: meeting } = await serviceClient
          .from('meetings')
          .select('organization_id')
          .eq('id', meetingId)
          .single()

        if (!meeting) return

        await generateMeetingBrief(serviceClient, {
          organizationId: meeting.organization_id,
          meetingId,
        })
        await sendMeetingConfirmations(serviceClient, {
          organizationId: meeting.organization_id,
          meetingId,
        })
      } catch {
        // Brief generation failures should not block booking confirmation UI.
      }
    })

    return {
      success: 'Meeting booked. Confirmation sent to both parties (mock for M6).',
      meetingId,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to book meeting' }
  }
}

export async function loadMeetingSettings() {
  const { activeOrganization } = await requireOrganizationContext()
  assertMeetingsEnabled(activeOrganization.id)

  const supabase = await createClient()
  const availability = await getOrCreateAvailabilitySettings(supabase, activeOrganization.id)

  const [{ data: calendar }, { data: links }] = await Promise.all([
    supabase
      .from('calendar_connections')
      .select('*')
      .eq('organization_id', activeOrganization.id)
      .eq('status', 'connected')
      .order('connected_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('booking_links')
      .select('id, token, label, created_at, is_active')
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return { availability, calendar, links: links ?? [] }
}
