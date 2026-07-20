import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'
import type { CreateCampaignInput, ReplyIntent } from '@atlas/types'
import { addSuppressionEntry } from '@atlas/deliverability'
import { executeSend } from './services/send-executor-service'
import { selectMailboxForSend, getNextRotationIndex } from './services/mailbox-rotation-service'
import { computeNextSendAt, isWithinSendWindow } from './services/send-scheduler-service'
import { classifyReply, shouldPauseSequenceOnReply } from './services/reply-classifier-service'

type Client = SupabaseClient<Database>

export async function createCampaign(
  client: Client,
  input: CreateCampaignInput & { organizationId: string },
): Promise<{ campaignId: string; enrolledCount: number }> {
  const { data: campaign, error } = await client
    .from('campaigns')
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      sequence_id: input.sequenceId,
      timezone: input.timezone,
      send_window_start: input.sendWindowStart,
      send_window_end: input.sendWindowEnd,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  const mailboxRows = input.mailboxIds.map((mailboxId, index) => ({
    organization_id: input.organizationId,
    campaign_id: campaign.id,
    mailbox_id: mailboxId,
    rotation_order: index,
  }))

  const { error: mailboxError } = await client.from('campaign_mailboxes').insert(mailboxRows)

  if (mailboxError) {
    throw mailboxError
  }

  const enrolledCount = await enrollCampaignContacts(client, {
    organizationId: input.organizationId,
    campaignId: campaign.id,
    sequenceId: input.sequenceId,
  })

  return { campaignId: campaign.id, enrolledCount }
}

export async function enrollCampaignContacts(
  client: Client,
  input: { organizationId: string; campaignId: string; sequenceId: string },
): Promise<number> {
  const { data: drafts } = await client
    .from('email_drafts')
    .select('contact_id, company_id')
    .eq('organization_id', input.organizationId)
    .eq('sequence_id', input.sequenceId)
    .eq('status', 'approved')
    .eq('step_order', 1)
    .not('contact_id', 'is', null)

  if (!drafts || drafts.length === 0) {
    return 0
  }

  const rows = drafts
    .filter((draft): draft is typeof draft & { contact_id: string } => Boolean(draft.contact_id))
    .map((draft) => ({
      organization_id: input.organizationId,
      campaign_id: input.campaignId,
      contact_id: draft.contact_id,
      company_id: draft.company_id,
      status: 'pending' as const,
      current_step_order: 1,
      next_send_at: new Date().toISOString(),
    }))

  const { error } = await client.from('campaign_contacts').upsert(rows, {
    onConflict: 'campaign_id,contact_id',
    ignoreDuplicates: true,
  })

  if (error) {
    throw error
  }

  return rows.length
}

export async function launchCampaign(
  client: Client,
  input: { organizationId: string; campaignId: string },
): Promise<void> {
  const { error } = await client
    .from('campaigns')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      paused_at: null,
    })
    .eq('id', input.campaignId)
    .eq('organization_id', input.organizationId)
    .eq('status', 'draft')

  if (error) {
    throw error
  }
}

export async function pauseCampaign(
  client: Client,
  input: { organizationId: string; campaignId: string },
): Promise<void> {
  const { error } = await client
    .from('campaigns')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
    })
    .eq('id', input.campaignId)
    .eq('organization_id', input.organizationId)
    .in('status', ['active'])

  if (error) {
    throw error
  }
}

export async function resumeCampaign(
  client: Client,
  input: { organizationId: string; campaignId: string },
): Promise<void> {
  const { error } = await client
    .from('campaigns')
    .update({
      status: 'active',
      paused_at: null,
    })
    .eq('id', input.campaignId)
    .eq('organization_id', input.organizationId)
    .eq('status', 'paused')

  if (error) {
    throw error
  }
}

export async function processCampaignSends(
  client: Client,
  input: { organizationId: string; campaignId: string; batchSize?: number },
): Promise<{ sent: number; failed: number; skipped: number }> {
  const batchSize = input.batchSize ?? 25

  const { data: campaign, error: campaignError } = await client
    .from('campaigns')
    .select('*')
    .eq('id', input.campaignId)
    .eq('organization_id', input.organizationId)
    .single()

  if (campaignError) {
    throw campaignError
  }

  if (campaign.status !== 'active') {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  if (
    !isWithinSendWindow({
      timezone: campaign.timezone,
      sendWindowStart: campaign.send_window_start.slice(0, 5),
      sendWindowEnd: campaign.send_window_end.slice(0, 5),
    })
  ) {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const { data: campaignMailboxes } = await client
    .from('campaign_mailboxes')
    .select('mailbox_id, rotation_order')
    .eq('campaign_id', input.campaignId)
    .order('rotation_order')

  const mailboxIds = campaignMailboxes?.map((row) => row.mailbox_id) ?? []
  const { data: mailboxes } =
    mailboxIds.length > 0
      ? await client.from('mailboxes').select('*').in('id', mailboxIds)
      : { data: [] }

  const now = new Date().toISOString()
  const { data: contacts } = await client
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', input.campaignId)
    .in('status', ['pending', 'active'])
    .or(`next_send_at.is.null,next_send_at.lte.${now}`)
    .limit(batchSize)

  let sent = 0
  let failed = 0
  let skipped = 0
  let rotationIndex = 0

  for (const contact of contacts ?? []) {
    const mailbox = selectMailboxForSend(mailboxes ?? [], campaignMailboxes ?? [], rotationIndex)

    if (!mailbox) {
      await client
        .from('campaigns')
        .update({ status: 'paused', paused_at: new Date().toISOString() })
        .eq('id', input.campaignId)
      skipped += 1
      continue
    }

    rotationIndex = getNextRotationIndex(rotationIndex, campaignMailboxes?.length ?? 0)

    const { data: draft } = await client
      .from('email_drafts')
      .select('*')
      .eq('organization_id', input.organizationId)
      .eq('contact_id', contact.contact_id)
      .eq('sequence_id', campaign.sequence_id)
      .eq('step_order', contact.current_step_order)
      .eq('status', 'approved')
      .maybeSingle()

    if (!draft) {
      await client.from('campaign_contacts').update({ status: 'skipped' }).eq('id', contact.id)
      skipped += 1
      continue
    }

    const { data: contactRow } = await client
      .from('contacts')
      .select('email')
      .eq('id', contact.contact_id)
      .single()

    if (!contactRow?.email) {
      skipped += 1
      continue
    }

    const result = await executeSend(client, {
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      campaignContactId: contact.id,
      mailboxId: mailbox.id,
      emailDraftId: draft.id,
      contactId: contact.contact_id,
      stepOrder: contact.current_step_order,
      recipientEmail: contactRow.email,
      subject: draft.subject,
      body: draft.body,
    })

    if (result.status === 'sent') {
      sent += 1

      const { data: steps } = await client
        .from('sequence_steps')
        .select('step_order, delay_days')
        .eq('sequence_id', campaign.sequence_id)
        .order('step_order')

      const currentIndex =
        steps?.findIndex((step) => step.step_order === contact.current_step_order) ?? -1
      const nextStep = currentIndex >= 0 ? steps?.[currentIndex + 1] : undefined

      if (nextStep) {
        await client
          .from('campaign_contacts')
          .update({
            status: 'active',
            current_step_order: nextStep.step_order,
            last_sent_at: new Date().toISOString(),
            next_send_at: computeNextSendAt(nextStep.delay_days).toISOString(),
          })
          .eq('id', contact.id)
      } else {
        await client
          .from('campaign_contacts')
          .update({
            status: 'completed',
            last_sent_at: new Date().toISOString(),
            next_send_at: null,
          })
          .eq('id', contact.id)
      }
    } else {
      failed += 1
    }
  }

  return { sent, failed, skipped }
}

export async function processInboundReply(
  client: Client,
  input: {
    organizationId: string
    campaignId: string
    campaignContactId: string
    sendRecordId: string
    fromEmail: string
    subject: string
    bodyPreview: string
  },
): Promise<{ intent: ReplyIntent; paused: boolean }> {
  const intent = classifyReply(input.bodyPreview)
  const now = new Date().toISOString()

  await client.from('inbound_messages').insert({
    organization_id: input.organizationId,
    campaign_id: input.campaignId,
    campaign_contact_id: input.campaignContactId,
    send_record_id: input.sendRecordId,
    from_email: input.fromEmail.toLowerCase(),
    subject: input.subject,
    body_preview: input.bodyPreview,
    reply_intent: intent,
    classified_at: now,
  })

  let paused = false

  if (intent === 'unsubscribe') {
    await addSuppressionEntry(client, {
      organizationId: input.organizationId,
      email: input.fromEmail,
      reason: 'unsubscribe',
    })

    await client
      .from('campaign_contacts')
      .update({ status: 'unsubscribed', replied_at: now, next_send_at: null })
      .eq('id', input.campaignContactId)
  } else if (shouldPauseSequenceOnReply(intent)) {
    await client
      .from('campaign_contacts')
      .update({ status: 'replied', replied_at: now, next_send_at: null })
      .eq('id', input.campaignContactId)
    paused = true
  }

  const { data: campaign } = await client
    .from('campaigns')
    .select('replies_count')
    .eq('id', input.campaignId)
    .single()

  if (campaign) {
    await client
      .from('campaigns')
      .update({ replies_count: campaign.replies_count + 1 })
      .eq('id', input.campaignId)
  }

  return { intent, paused }
}

export async function handleHardBounce(
  client: Client,
  input: {
    organizationId: string
    campaignId: string
    campaignContactId: string
    email: string
  },
): Promise<void> {
  await addSuppressionEntry(client, {
    organizationId: input.organizationId,
    email: input.email,
    reason: 'hard_bounce',
  })

  await client
    .from('campaign_contacts')
    .update({ status: 'bounced', next_send_at: null })
    .eq('id', input.campaignContactId)

  const { data: campaign } = await client
    .from('campaigns')
    .select('bounces_count')
    .eq('id', input.campaignId)
    .single()

  if (campaign) {
    await client
      .from('campaigns')
      .update({ bounces_count: campaign.bounces_count + 1 })
      .eq('id', input.campaignId)
  }
}
