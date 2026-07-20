'use server'

import { isFeatureEnabled } from '@atlas/config'
import { acknowledgeAlert, getUsageSummary, runDeepHealthCheck, runOpsMonitor } from '@atlas/ops'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfigFromEnv } from '@atlas/database'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface OpsActionState {
  error?: string
  success?: string
}

function assertOpsEnabled(organizationId: string): void {
  if (!isFeatureEnabled('opsMonitoring', { organizationId })) {
    throw new Error('Ops monitoring is disabled. Set FF_OPS_MONITORING=true to enable.')
  }
}

export async function runOpsMonitorAction(): Promise<OpsActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertOpsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can run ops monitoring' }
  }

  const supabase = await createClient()

  try {
    const result = await runOpsMonitor(supabase, activeOrganization.id)
    revalidatePath('/operations')
    return { success: `Monitoring complete. ${result.alertsCreated} alert(s) created or updated.` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to run monitoring' }
  }
}

export async function acknowledgeAlertAction(alertId: string): Promise<OpsActionState> {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  assertOpsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can acknowledge alerts' }
  }

  const supabase = await createClient()

  try {
    await acknowledgeAlert(supabase, {
      organizationId: activeOrganization.id,
      alertId,
      userId: user.id,
    })
    revalidatePath('/operations')
    return { success: 'Alert acknowledged' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to acknowledge alert' }
  }
}

export async function loadOperationsDashboard() {
  const { activeOrganization } = await requireOrganizationContext()
  assertOpsEnabled(activeOrganization.id)

  const supabase = await createClient()
  const config = getSupabaseConfigFromEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  const healthClient =
    config.url && config.anonKey
      ? createSupabaseClient(config.url, config.anonKey, { auth: { persistSession: false } })
      : null

  const [health, usage, alertsResult] = await Promise.all([
    runDeepHealthCheck(healthClient, {
      supabaseUrl: config.url,
      supabaseAnonKey: config.anonKey,
      supabaseServiceRoleKey: config.serviceRoleKey,
    }),
    getUsageSummary(supabase, activeOrganization.id),
    supabase
      .from('system_alerts')
      .select('*')
      .eq('organization_id', activeOrganization.id)
      .in('status', ['open', 'acknowledged'])
      .order('created_at', { ascending: false }),
  ])

  if (alertsResult.error) {
    throw alertsResult.error
  }

  return {
    health,
    usage,
    alerts: alertsResult.data,
  }
}
