import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@atlas/database/types'
import type {
  AvailabilitySettingsInput,
  ConnectCalendarInput,
  CreateBookingLinkInput,
  PublicBookingContext,
} from '@atlas/types'
import { publicBookingContextSchema } from '@atlas/types'
import { DEFAULT_WEEKLY_HOURS } from './services/availability-service'
import { generateMeetingBriefContent, PROMPT_VERSION } from './services/brief-generation-service'

type Client = SupabaseClient<Database>

function createBookingToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export async function getOrCreateAvailabilitySettings(
  client: Client,
  organizationId: string,
): Promise<AvailabilitySettingsInput & { organizationId: string }> {
  const { data } = await client
    .from('availability_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (data) {
    return {
      organizationId,
      timezone: data.timezone,
      slotDurationMinutes: data.slot_duration_minutes,
      minNoticeHours: data.min_notice_hours,
      bufferMinutes: data.buffer_minutes,
      weeklyHours: data.weekly_hours as AvailabilitySettingsInput['weeklyHours'],
    }
  }

  const { error } = await client.from('availability_settings').insert({
    organization_id: organizationId,
    weekly_hours: DEFAULT_WEEKLY_HOURS as unknown as Json,
  })

  if (error) {
    throw error
  }

  return {
    organizationId,
    timezone: 'UTC',
    slotDurationMinutes: 30,
    minNoticeHours: 24,
    bufferMinutes: 0,
    weeklyHours: DEFAULT_WEEKLY_HOURS,
  }
}

export async function updateAvailabilitySettings(
  client: Client,
  input: AvailabilitySettingsInput & { organizationId: string },
): Promise<void> {
  const { error } = await client.from('availability_settings').upsert({
    organization_id: input.organizationId,
    timezone: input.timezone,
    slot_duration_minutes: input.slotDurationMinutes,
    min_notice_hours: input.minNoticeHours,
    buffer_minutes: input.bufferMinutes,
    weekly_hours: input.weeklyHours as unknown as Json,
  })

  if (error) {
    throw error
  }
}

export async function connectCalendar(
  client: Client,
  input: ConnectCalendarInput & { organizationId: string; userId: string },
): Promise<void> {
  const { error } = await client.from('calendar_connections').upsert(
    {
      organization_id: input.organizationId,
      user_id: input.userId,
      provider: input.provider,
      status: 'connected',
      external_account_email: input.externalAccountEmail.toLowerCase(),
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id,provider' },
  )

  if (error) {
    throw error
  }
}

export async function createBookingLink(
  client: Client,
  input: CreateBookingLinkInput & { organizationId: string; createdBy: string },
): Promise<{ linkId: string; token: string }> {
  const token = createBookingToken()

  const { data, error } = await client
    .from('booking_links')
    .insert({
      organization_id: input.organizationId,
      token,
      contact_id: input.contactId ?? null,
      company_id: input.companyId ?? null,
      campaign_id: input.campaignId ?? null,
      created_by: input.createdBy,
      label: input.label ?? null,
    })
    .select('id, token')
    .single()

  if (error) {
    throw error
  }

  return { linkId: data.id, token: data.token }
}

export async function getPublicBookingContext(
  client: Client,
  token: string,
): Promise<PublicBookingContext> {
  const { data, error } = await client.rpc('get_booking_link_public', { link_token: token })

  if (error) {
    throw error
  }

  return publicBookingContextSchema.parse(data)
}

export async function bookMeetingPublic(
  client: Client,
  input: { token: string; attendeeName: string; attendeeEmail: string; scheduledStart: string },
): Promise<string> {
  const { data, error } = await client.rpc('book_meeting_public', {
    link_token: input.token,
    attendee_name: input.attendeeName,
    attendee_email: input.attendeeEmail,
    scheduled_start: input.scheduledStart,
  })

  if (error) {
    throw error
  }

  if (typeof data !== 'string') {
    throw new Error('Unexpected booking response')
  }

  return data
}

export async function generateMeetingBrief(
  client: Client,
  input: { organizationId: string; meetingId: string },
): Promise<void> {
  const { data: meeting, error: meetingError } = await client
    .from('meetings')
    .select('*')
    .eq('id', input.meetingId)
    .eq('organization_id', input.organizationId)
    .single()

  if (meetingError) {
    throw meetingError
  }

  let companyName: string | null = null
  let contactName: string | null = null
  let researchSummary: string | null = null
  let painPoints: string[] = []

  if (meeting.company_id) {
    const { data: company } = await client
      .from('companies')
      .select('name')
      .eq('id', meeting.company_id)
      .maybeSingle()
    companyName = company?.name ?? null

    const { data: report } = await client
      .from('research_reports')
      .select('summary, pain_points')
      .eq('company_id', meeting.company_id)
      .maybeSingle()

    researchSummary = report?.summary ?? null
    painPoints = Array.isArray(report?.pain_points) ? (report.pain_points as string[]) : []
  }

  if (meeting.contact_id) {
    const { data: contact } = await client
      .from('contacts')
      .select('full_name')
      .eq('id', meeting.contact_id)
      .maybeSingle()
    contactName = contact?.full_name ?? null
  }

  const { data: replies } = meeting.contact_id
    ? await client
        .from('inbound_messages')
        .select('body_preview')
        .eq('organization_id', input.organizationId)
        .order('received_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const replySnippets = (replies ?? []).map((reply) => reply.body_preview)

  const { content, sources } = generateMeetingBriefContent({
    companyName,
    contactName,
    attendeeName: meeting.attendee_name,
    researchSummary,
    painPoints,
    replySnippets,
    scheduledStart: meeting.scheduled_start,
  })

  const { error } = await client.from('meeting_briefs').upsert(
    {
      organization_id: input.organizationId,
      meeting_id: meeting.id,
      content,
      sources,
      prompt_version: PROMPT_VERSION,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'meeting_id' },
  )

  if (error) {
    throw error
  }
}

export async function sendMeetingConfirmations(
  client: Client,
  input: { organizationId: string; meetingId: string },
): Promise<void> {
  const { data: meeting, error } = await client
    .from('meetings')
    .select('confirmation_sent_at')
    .eq('id', input.meetingId)
    .eq('organization_id', input.organizationId)
    .single()

  if (error || meeting.confirmation_sent_at) {
    return
  }

  await client
    .from('meetings')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', input.meetingId)
}
