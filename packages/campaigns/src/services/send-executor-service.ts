import type { Json } from '@atlas/database/types'
import type { PreSendCheckFailure } from '@atlas/types'
import {
  canSendEmail,
  loadSuppressionSet,
  runPreSendChecks,
  shouldPauseCampaignForMailboxHealth,
} from '@atlas/deliverability'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'

type Client = SupabaseClient<Database>

export interface ExecuteSendInput {
  organizationId: string
  campaignId: string
  campaignContactId: string
  mailboxId: string
  emailDraftId: string
  contactId: string
  stepOrder: number
  recipientEmail: string
  subject: string
  body: string
}

export interface ExecuteSendResult {
  sendRecordId: string
  status: 'sent' | 'failed' | 'skipped'
  failures: PreSendCheckFailure[]
}

function ensureUnsubscribeLink(body: string, organizationId: string): string {
  if (body.toLowerCase().includes('unsubscribe')) {
    return body
  }

  const url = `https://app.atlas.local/unsubscribe?org=${organizationId}`
  return `${body.trim()}\n\n---\nUnsubscribe: ${url}`
}

export async function executeSend(
  client: Client,
  input: ExecuteSendInput,
): Promise<ExecuteSendResult> {
  const { data: mailbox, error: mailboxError } = await client
    .from('mailboxes')
    .select('*')
    .eq('id', input.mailboxId)
    .eq('organization_id', input.organizationId)
    .single()

  if (mailboxError) {
    throw mailboxError
  }

  const { data: domain, error: domainError } = await client
    .from('outreach_domains')
    .select('*')
    .eq('id', mailbox.domain_id)
    .single()

  if (domainError) {
    throw domainError
  }

  const suppressed = await loadSuppressionSet(client, input.organizationId)
  const bodyWithUnsubscribe = ensureUnsubscribeLink(input.body, input.organizationId)

  const checkContext = {
    recipientEmail: input.recipientEmail,
    fromEmail: mailbox.email_address,
    body: bodyWithUnsubscribe,
    suppressedEmails: suppressed,
    mailboxEmail: mailbox.email_address,
    mailboxSendsToday: mailbox.sends_today,
    mailboxDailyLimit: mailbox.daily_send_limit,
    mailboxHealthScore: mailbox.health_score,
    warmUpStartedAt: new Date(mailbox.warm_up_started_at),
    domainVerified: domain.verification_status === 'verified',
    domainHealthScore: domain.health_score,
  }

  const failures = runPreSendChecks(checkContext)
  const failuresJson = failures as unknown as Json

  if (shouldPauseCampaignForMailboxHealth(mailbox.health_score)) {
    await client
      .from('campaigns')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', input.campaignId)
      .eq('organization_id', input.organizationId)
  }

  const baseRecord = {
    organization_id: input.organizationId,
    campaign_id: input.campaignId,
    campaign_contact_id: input.campaignContactId,
    email_draft_id: input.emailDraftId,
    mailbox_id: input.mailboxId,
    contact_id: input.contactId,
    step_order: input.stepOrder,
    recipient_email: input.recipientEmail.toLowerCase(),
    subject: input.subject,
    body: bodyWithUnsubscribe,
    pre_send_failures: failuresJson,
  }

  if (!canSendEmail(checkContext)) {
    const { data: record, error } = await client
      .from('send_records')
      .insert({ ...baseRecord, status: 'failed' })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return { sendRecordId: record.id, status: 'failed', failures }
  }

  const externalId = `mock_${crypto.randomUUID()}`
  const sentAt = new Date().toISOString()

  const { data: record, error: insertError } = await client
    .from('send_records')
    .insert({
      ...baseRecord,
      status: 'sent',
      external_message_id: externalId,
      sent_at: sentAt,
    })
    .select('id')
    .single()

  if (insertError) {
    throw insertError
  }

  await client
    .from('mailboxes')
    .update({ sends_today: mailbox.sends_today + 1 })
    .eq('id', mailbox.id)

  const { data: campaign } = await client
    .from('campaigns')
    .select('sends_count')
    .eq('id', input.campaignId)
    .single()

  if (campaign) {
    await client
      .from('campaigns')
      .update({ sends_count: campaign.sends_count + 1 })
      .eq('id', input.campaignId)
  }

  return { sendRecordId: record.id, status: 'sent', failures: [] }
}
