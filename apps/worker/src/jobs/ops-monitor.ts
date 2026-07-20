import { opsMonitorJobPayloadSchema } from '@atlas/types'
import { runOpsMonitor } from '@atlas/ops'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker ops jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const opsMonitorJob = createJob({
  id: 'ops-monitor',
  description: 'Evaluate deliverability and pipeline alerts for an organization',
  schema: opsMonitorJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const result = await runOpsMonitor(client, payload.organizationId)

    workerLogger.info('ops-monitor completed', {
      organizationId: payload.organizationId,
      alertsCreated: result.alertsCreated,
    })
  },
})

bindTriggerDevAdapter()

export { opsMonitorJob as default }
