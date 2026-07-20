import type { HealthCheckResult } from '@atlas/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'

type Client = SupabaseClient<Database>

export interface HealthCheckEnv {
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceRoleKey?: string
}

export async function runDeepHealthCheck(
  client: Client | null,
  env: HealthCheckEnv,
): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {}
  const timestamp = new Date().toISOString()

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    checks.config = { status: 'skipped', message: 'Supabase env not configured' }
  } else {
    checks.config = { status: 'ok' }
  }

  if (!client) {
    checks.database = { status: 'skipped', message: 'No database client available' }
  } else {
    const started = Date.now()
    const { error } = await client.from('organizations').select('id').limit(1)
    const latencyMs = Date.now() - started

    if (error) {
      checks.database = { status: 'error', latencyMs, message: error.message }
    } else {
      checks.database = { status: 'ok', latencyMs }
    }
  }

  if (!env.supabaseServiceRoleKey) {
    checks.worker = { status: 'skipped', message: 'Service role key not configured' }
  } else {
    checks.worker = { status: 'ok' }
  }

  const hasError = Object.values(checks).some((check) => check.status === 'error')
  const hasOk = Object.values(checks).some((check) => check.status === 'ok')

  return {
    status: hasError ? 'error' : hasOk ? 'ok' : 'degraded',
    checks,
    timestamp,
  }
}

export const RLS_PROTECTED_TABLES = [
  'organizations',
  'memberships',
  'companies',
  'contacts',
  'campaigns',
  'send_records',
  'mailboxes',
  'outreach_domains',
  'proposals',
  'invoices',
  'system_alerts',
  'usage_events',
] as const

export function getRlsInventory(): { table: string; rlsRequired: boolean }[] {
  return RLS_PROTECTED_TABLES.map((table) => ({ table, rlsRequired: true }))
}
