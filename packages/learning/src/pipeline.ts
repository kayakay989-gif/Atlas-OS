import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'
import type { CampaignMetrics, CreateExperimentInput, RecordContentEditInput } from '@atlas/types'
import {
  buildAbTestResults,
  buildStyleHintsFromEdits,
  extractCopyPatterns,
  findOptimalSendHour,
} from './services/analysis-service'

type Client = SupabaseClient<Database>

export async function aggregateCampaignMetrics(
  client: Client,
  organizationId: string,
): Promise<CampaignMetrics[]> {
  const { data: campaigns, error } = await client
    .from('campaigns')
    .select('id, name, sends_count, replies_count, bounces_count')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const metrics: CampaignMetrics[] = []

  for (const campaign of campaigns) {
    const { data: campaignCompanies } = await client
      .from('campaign_contacts')
      .select('company_id')
      .eq('campaign_id', campaign.id)

    const companyIds = [...new Set((campaignCompanies ?? []).map((row) => row.company_id))]

    let meetings = 0
    let proposals = 0

    if (companyIds.length > 0) {
      const [{ count: meetingCount }, { count: proposalCount }] = await Promise.all([
        client
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .in('company_id', companyIds),
        client
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .in('company_id', companyIds),
      ])
      meetings = meetingCount ?? 0
      proposals = proposalCount ?? 0
    }

    const sends = campaign.sends_count
    const replies = campaign.replies_count

    metrics.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      sends,
      replies,
      bounces: campaign.bounces_count,
      meetings,
      proposals,
      replyRate: sends > 0 ? replies / sends : 0,
    })
  }

  return metrics
}

export async function createExperiment(
  client: Client,
  input: CreateExperimentInput & { organizationId: string },
): Promise<{ experimentId: string }> {
  const { data: experiment, error } = await client
    .from('ab_experiments')
    .insert({
      organization_id: input.organizationId,
      campaign_id: input.campaignId ?? null,
      name: input.name,
      experiment_type: input.experimentType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  const { error: variantError } = await client.from('ab_experiment_variants').insert(
    input.variants.map((variant) => ({
      organization_id: input.organizationId,
      experiment_id: experiment.id,
      label: variant.label,
      subject_pattern: variant.subjectPattern ?? null,
      body_pattern: variant.bodyPattern ?? null,
      send_hour: variant.sendHour ?? null,
    })),
  )

  if (variantError) {
    throw variantError
  }

  return { experimentId: experiment.id }
}

function matchesVariant(
  send: { subject: string; body: string; hour: number },
  variant: {
    subject_pattern: string | null
    body_pattern: string | null
    send_hour: number | null
  },
): boolean {
  if (variant.send_hour !== null && send.hour !== variant.send_hour) {
    return false
  }
  if (
    variant.subject_pattern &&
    !send.subject.toLowerCase().includes(variant.subject_pattern.toLowerCase())
  ) {
    return false
  }
  if (
    variant.body_pattern &&
    !send.body.toLowerCase().includes(variant.body_pattern.toLowerCase())
  ) {
    return false
  }
  return Boolean(variant.subject_pattern ?? variant.body_pattern ?? variant.send_hour !== null)
}

export async function refreshExperimentMetrics(
  client: Client,
  input: { organizationId: string; experimentId: string },
): Promise<void> {
  const { data: experiment, error: experimentError } = await client
    .from('ab_experiments')
    .select('id, campaign_id')
    .eq('id', input.experimentId)
    .eq('organization_id', input.organizationId)
    .single()

  if (experimentError) {
    throw experimentError
  }

  const { data: variants, error: variantsError } = await client
    .from('ab_experiment_variants')
    .select('*')
    .eq('experiment_id', experiment.id)

  if (variantsError) {
    throw variantsError
  }

  const variantList = variants

  let sendQuery = client
    .from('send_records')
    .select('id, subject, body, sent_at, campaign_contact_id')
    .eq('organization_id', input.organizationId)
    .eq('status', 'sent')

  if (experiment.campaign_id) {
    sendQuery = sendQuery.eq('campaign_id', experiment.campaign_id)
  }

  const { data: sends, error: sendsError } = await sendQuery
  if (sendsError) {
    throw sendsError
  }

  const sendList = sends

  const contactIds = [...new Set(sendList.map((send) => send.campaign_contact_id))]
  const { data: repliedContacts } = await client
    .from('campaign_contacts')
    .select('id')
    .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000'])
    .not('replied_at', 'is', null)

  const repliedSet = new Set((repliedContacts ?? []).map((contact) => contact.id))

  for (const variant of variantList) {
    let sendsCount = 0
    let repliesCount = 0

    for (const send of sendList) {
      const hour = send.sent_at ? new Date(send.sent_at).getUTCHours() : 0
      if (matchesVariant({ subject: send.subject, body: send.body, hour }, variant)) {
        sendsCount += 1
        if (repliedSet.has(send.campaign_contact_id)) {
          repliesCount += 1
        }
      }
    }

    await client
      .from('ab_experiment_variants')
      .update({ sends_count: sendsCount, replies_count: repliesCount })
      .eq('id', variant.id)
  }
}

export async function getExperimentResults(
  client: Client,
  input: { organizationId: string; experimentId: string },
) {
  await refreshExperimentMetrics(client, input)

  const { data: variants, error } = await client
    .from('ab_experiment_variants')
    .select('id, label, sends_count, replies_count')
    .eq('experiment_id', input.experimentId)
    .eq('organization_id', input.organizationId)
    .order('label')

  if (error) {
    throw error
  }

  return buildAbTestResults(
    variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      sends: variant.sends_count,
      replies: variant.replies_count,
    })),
  )
}

export async function recordContentEdit(
  client: Client,
  input: RecordContentEditInput & { organizationId: string; editorId?: string },
): Promise<void> {
  const { error } = await client.from('content_edit_feedback').insert({
    organization_id: input.organizationId,
    content_type: input.contentType,
    source_id: input.sourceId,
    original_subject: input.originalSubject ?? null,
    original_body: input.originalBody,
    edited_subject: input.editedSubject ?? null,
    edited_body: input.editedBody,
    editor_id: input.editorId ?? null,
    prompt_version: input.promptVersion,
  })

  if (error) {
    throw error
  }
}

export async function getRecentStyleHints(
  client: Client,
  organizationId: string,
  limit = 3,
): Promise<string[]> {
  const { data: edits, error } = await client
    .from('content_edit_feedback')
    .select('edited_subject, edited_body')
    .eq('organization_id', organizationId)
    .eq('content_type', 'email_draft')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return buildStyleHintsFromEdits(
    edits.map((edit) => ({
      editedSubject: edit.edited_subject,
      editedBody: edit.edited_body,
    })),
    limit,
  )
}

export async function runLearningAnalysis(
  client: Client,
  organizationId: string,
): Promise<{ recommendationsCreated: number }> {
  await client
    .from('optimization_recommendations')
    .delete()
    .eq('organization_id', organizationId)
    .eq('status', 'pending')

  let recommendationsCreated = 0

  const { data: sends, error: sendsError } = await client
    .from('send_records')
    .select('subject, body, sent_at, campaign_contact_id')
    .eq('organization_id', organizationId)
    .eq('status', 'sent')

  if (sendsError) {
    throw sendsError
  }

  const sendList = sends
  const contactIds = [...new Set(sendList.map((send) => send.campaign_contact_id))]
  const { data: repliedContacts } = await client
    .from('campaign_contacts')
    .select('id')
    .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000'])
    .not('replied_at', 'is', null)

  const repliedSet = new Set((repliedContacts ?? []).map((contact) => contact.id))

  const sendRows = sendList.map((send) => ({
    subject: send.subject,
    body: send.body,
    replied: repliedSet.has(send.campaign_contact_id),
    hour: send.sent_at ? new Date(send.sent_at).getUTCHours() : 0,
  }))

  const copyPatterns = extractCopyPatterns(sendRows)
  if (copyPatterns.highPerforming.length > 0) {
    await client.from('optimization_recommendations').insert({
      organization_id: organizationId,
      recommendation_type: 'copy_pattern',
      title: 'High-performing subject patterns',
      summary: `Phrases like "${copyPatterns.highPerforming.join('", "')}" correlate with higher reply rates.`,
      payload: copyPatterns,
      confidence_score: 72,
    })
    recommendationsCreated += 1
  }

  const optimalHour = findOptimalSendHour(sendRows)
  if (optimalHour) {
    await client.from('optimization_recommendations').insert({
      organization_id: organizationId,
      recommendation_type: 'send_time',
      title: `Optimal send window around ${optimalHour.hour}:00 UTC`,
      summary: `Sends around ${optimalHour.hour}:00 UTC show a ${Math.round(optimalHour.replyRate * 100)}% reply rate.`,
      payload: optimalHour,
      confidence_score: 65,
    })
    recommendationsCreated += 1
  }

  const { data: icpProfiles } = await client
    .from('icp_profiles')
    .select('id, name, industries')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  for (const icp of icpProfiles ?? []) {
    const { data: companies } = await client
      .from('companies')
      .select('id, icp_profile_id')
      .eq('organization_id', organizationId)
      .eq('icp_profile_id', icp.id)

    const companyIds = (companies ?? []).map((company) => company.id)
    if (companyIds.length === 0) continue

    const { data: convertedContacts } = await client
      .from('campaign_contacts')
      .select('company_id')
      .in('company_id', companyIds)
      .not('replied_at', 'is', null)

    const convertedCount = new Set((convertedContacts ?? []).map((row) => row.company_id)).size
    const conversionRate = convertedCount / companyIds.length

    if (conversionRate >= 0.2) {
      await client.from('optimization_recommendations').insert({
        organization_id: organizationId,
        recommendation_type: 'icp_refinement',
        title: `Expand ICP "${icp.name}"`,
        summary: `${Math.round(conversionRate * 100)}% of companies in this ICP replied. Consider increasing discovery volume for similar profiles.`,
        payload: { icpProfileId: icp.id, industries: icp.industries, conversionRate },
        confidence_score: Math.min(95, Math.round(conversionRate * 100 + 40)),
        icp_profile_id: icp.id,
      })
      recommendationsCreated += 1
    }
  }

  const { data: experiments } = await client
    .from('ab_experiments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'running')

  for (const experiment of experiments ?? []) {
    await refreshExperimentMetrics(client, {
      organizationId,
      experimentId: experiment.id,
    })
  }

  return { recommendationsCreated }
}

export async function reviewRecommendation(
  client: Client,
  input: {
    organizationId: string
    recommendationId: string
    decision: 'accepted' | 'dismissed'
    reviewerId: string
  },
): Promise<void> {
  const { error } = await client
    .from('optimization_recommendations')
    .update({
      status: input.decision,
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.recommendationId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}
