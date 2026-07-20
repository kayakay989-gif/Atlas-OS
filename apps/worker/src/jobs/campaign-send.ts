import { campaignSendJobPayloadSchema } from '@atlas/types'
import { processCampaignSends } from '@atlas/campaigns'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker campaign jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const campaignSendJob = createJob({
  id: 'campaign-send',
  description: 'Process queued sends for an active campaign',
  schema: campaignSendJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const result = await processCampaignSends(client, {
      organizationId: payload.organizationId,
      campaignId: payload.campaignId,
      batchSize: payload.batchSize,
    })

    workerLogger.info('campaign-send completed', {
      organizationId: payload.organizationId,
      campaignId: payload.campaignId,
      ...result,
    })
  },
})

bindTriggerDevAdapter()

export { campaignSendJob as default }
