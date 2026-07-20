import { domainDnsCheckJobPayloadSchema } from '@atlas/types'
import { checkDomainDns } from '@atlas/deliverability'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker deliverability jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const domainDnsCheckJob = createJob({
  id: 'domain-dns-check',
  description: 'Validate SPF, DKIM, and DMARC for an outreach domain',
  schema: domainDnsCheckJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    await checkDomainDns(client, payload)

    workerLogger.info('domain-dns-check completed', {
      organizationId: payload.organizationId,
      domainId: payload.domainId,
    })
  },
})

bindTriggerDevAdapter()

export { domainDnsCheckJob as default }
