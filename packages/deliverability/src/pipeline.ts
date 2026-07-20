import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'
import type { SuppressionReason } from '@atlas/types'
import { computeDomainHealthScore, validateDomainDns } from './services/dns-validation-service'
import { computeMailboxHealthScore } from './services/health-score-service'
import { getWarmUpDailyLimit, getWarmUpDay, isWarmUpComplete } from './constants/warm-up'

type Client = SupabaseClient<Database>

export async function checkDomainDns(
  client: Client,
  input: { organizationId: string; domainId: string },
): Promise<void> {
  const { data: domain, error } = await client
    .from('outreach_domains')
    .select('*')
    .eq('id', input.domainId)
    .eq('organization_id', input.organizationId)
    .single()

  if (error) {
    throw error
  }

  const dnsResult = await validateDomainDns(domain.domain, domain.dkim_selector)
  const healthScore = computeDomainHealthScore(dnsResult)
  const verified = dnsResult.spfValid && dnsResult.dkimValid && dnsResult.dmarcValid

  await client
    .from('outreach_domains')
    .update({
      spf_valid: dnsResult.spfValid,
      dkim_valid: dnsResult.dkimValid,
      dmarc_valid: dnsResult.dmarcValid,
      verification_status: verified
        ? 'verified'
        : dnsResult.spfValid || dnsResult.dmarcValid
          ? 'pending'
          : 'failed',
      health_score: healthScore,
      dns_last_checked_at: new Date().toISOString(),
    })
    .eq('id', domain.id)
}

export async function refreshMailboxHealthScores(
  client: Client,
  organizationId: string,
): Promise<void> {
  const { data: mailboxes } = await client
    .from('mailboxes')
    .select('*')
    .eq('organization_id', organizationId)

  if (!mailboxes) {
    return
  }

  const domainIds = [...new Set(mailboxes.map((mailbox) => mailbox.domain_id))]
  const { data: domains } = await client
    .from('outreach_domains')
    .select('id, health_score')
    .in('id', domainIds)

  const domainHealthById = new Map(
    (domains ?? []).map((domain) => [domain.id, domain.health_score]),
  )

  for (const mailbox of mailboxes) {
    const healthScore = computeMailboxHealthScore({
      bounceRate30d: mailbox.bounce_rate_30d,
      complaintRate30d: mailbox.complaint_rate_30d,
      sendsToday: mailbox.sends_today,
      warmUpStartedAt: new Date(mailbox.warm_up_started_at),
      dailySendLimit: mailbox.daily_send_limit,
      domainHealthScore: domainHealthById.get(mailbox.domain_id) ?? 0,
    })

    const warmUpComplete = isWarmUpComplete(new Date(mailbox.warm_up_started_at))
    const status =
      mailbox.status === 'disabled' ? 'disabled' : warmUpComplete ? 'active' : 'warming'

    await client
      .from('mailboxes')
      .update({ health_score: healthScore, status })
      .eq('id', mailbox.id)
  }
}

export async function addSuppressionEntry(
  client: Client,
  input: {
    organizationId: string
    email: string
    reason: SuppressionReason
    notes?: string
  },
): Promise<void> {
  const { error } = await client.from('suppression_entries').upsert(
    {
      organization_id: input.organizationId,
      email: input.email.toLowerCase(),
      reason: input.reason,
      notes: input.notes ?? null,
    },
    { onConflict: 'organization_id,email' },
  )

  if (error) {
    throw error
  }
}

export async function loadSuppressionSet(
  client: Client,
  organizationId: string,
): Promise<Set<string>> {
  const { data } = await client
    .from('suppression_entries')
    .select('email')
    .eq('organization_id', organizationId)

  return new Set((data ?? []).map((entry) => entry.email.toLowerCase()))
}

export function getMailboxWarmUpProgress(warmUpStartedAt: Date): {
  day: number
  dailyLimit: number
  complete: boolean
} {
  return {
    day: getWarmUpDay(warmUpStartedAt),
    dailyLimit: getWarmUpDailyLimit(warmUpStartedAt),
    complete: isWarmUpComplete(warmUpStartedAt),
  }
}
