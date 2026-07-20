import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@atlas/database/types'
import type { AlertSeverity, RecordUsageEventInput, UsageEventType } from '@atlas/types'

type Client = SupabaseClient<Database>

interface UpsertAlertInput {
  organizationId: string
  alertKey: string
  severity: AlertSeverity
  title: string
  message: string
  payload?: Record<string, unknown>
}

export async function upsertOpenAlert(client: Client, input: UpsertAlertInput): Promise<void> {
  const { data: existing } = await client
    .from('system_alerts')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('alert_key', input.alertKey)
    .eq('status', 'open')
    .maybeSingle()

  if (existing) {
    const { error } = await client
      .from('system_alerts')
      .update({
        severity: input.severity,
        title: input.title,
        message: input.message,
        payload: (input.payload ?? {}) as Json,
      })
      .eq('id', existing.id)

    if (error) {
      throw error
    }
    return
  }

  const { error } = await client.from('system_alerts').insert({
    organization_id: input.organizationId,
    alert_key: input.alertKey,
    severity: input.severity,
    title: input.title,
    message: input.message,
    payload: (input.payload ?? {}) as Json,
    status: 'open',
  })

  if (error) {
    throw error
  }
}

export async function resolveAlertIfHealthy(
  client: Client,
  organizationId: string,
  alertKey: string,
): Promise<void> {
  const { error } = await client
    .from('system_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('alert_key', alertKey)
    .eq('status', 'open')

  if (error) {
    throw error
  }
}

export async function acknowledgeAlert(
  client: Client,
  input: { organizationId: string; alertId: string; userId: string },
): Promise<void> {
  const { error } = await client
    .from('system_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: input.userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', input.alertId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}

export async function evaluateMonitoringAlerts(
  client: Client,
  organizationId: string,
): Promise<{ alertsCreated: number }> {
  let alertsCreated = 0

  const { data: mailboxes } = await client
    .from('mailboxes')
    .select('id, email_address, health_score, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const unhealthyMailboxes = (mailboxes ?? []).filter((mailbox) => mailbox.health_score < 50)

  if (unhealthyMailboxes.length > 0) {
    await upsertOpenAlert(client, {
      organizationId,
      alertKey: 'mailbox_health_low',
      severity: 'critical',
      title: 'Mailbox health is critically low',
      message: `${unhealthyMailboxes.length} active mailbox(es) below 50 health score. Pause campaigns until resolved.`,
      payload: { mailboxIds: unhealthyMailboxes.map((mailbox) => mailbox.id) },
    })
    alertsCreated += 1
  } else {
    await resolveAlertIfHealthy(client, organizationId, 'mailbox_health_low')
  }

  const { data: campaigns } = await client
    .from('campaigns')
    .select('sends_count, bounces_count, replies_count')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const totals = (campaigns ?? []).reduce(
    (acc, campaign) => ({
      sends: acc.sends + campaign.sends_count,
      bounces: acc.bounces + campaign.bounces_count,
    }),
    { sends: 0, bounces: 0 },
  )

  const bounceRate = totals.sends > 0 ? totals.bounces / totals.sends : 0

  if (totals.sends >= 20 && bounceRate >= 0.05) {
    await upsertOpenAlert(client, {
      organizationId,
      alertKey: 'bounce_rate_high',
      severity: 'warning',
      title: 'Elevated bounce rate on active campaigns',
      message: `Bounce rate is ${Math.round(bounceRate * 100)}% across active campaigns. Review list quality and DNS.`,
      payload: { bounceRate, sends: totals.sends, bounces: totals.bounces },
    })
    alertsCreated += 1
  } else {
    await resolveAlertIfHealthy(client, organizationId, 'bounce_rate_high')
  }

  return { alertsCreated }
}

export async function recordUsageEvent(
  client: Client,
  input: RecordUsageEventInput & { organizationId: string },
): Promise<void> {
  const { error } = await client.from('usage_events').insert({
    organization_id: input.organizationId,
    event_type: input.eventType,
    quantity: input.quantity,
    metadata: (input.metadata ?? {}) as Json,
  })

  if (error) {
    throw error
  }
}

export async function getUsageSummary(
  client: Client,
  organizationId: string,
  days = 30,
): Promise<{ eventType: UsageEventType; total: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: events, error } = await client
    .from('usage_events')
    .select('event_type, quantity')
    .eq('organization_id', organizationId)
    .gte('recorded_at', since.toISOString())

  if (error) {
    throw error
  }

  const totals = new Map<UsageEventType, number>()

  for (const event of events) {
    const current = totals.get(event.event_type) ?? 0
    totals.set(event.event_type, current + event.quantity)
  }

  return [...totals.entries()].map(([eventType, total]) => ({ eventType, total }))
}

export async function runOpsMonitor(
  client: Client,
  organizationId: string,
): Promise<{ alertsCreated: number }> {
  return evaluateMonitoringAlerts(client, organizationId)
}
