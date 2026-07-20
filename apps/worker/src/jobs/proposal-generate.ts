import { proposalGenerateJobPayloadSchema } from '@atlas/types'
import { regenerateProposalContent } from '@atlas/conversion'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker proposal jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const proposalGenerateJob = createJob({
  id: 'proposal-generate',
  description: 'Regenerate proposal content from research and meeting brief',
  schema: proposalGenerateJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    await regenerateProposalContent(client, {
      organizationId: payload.organizationId,
      proposalId: payload.proposalId,
    })

    workerLogger.info('proposal-generate completed', {
      organizationId: payload.organizationId,
      proposalId: payload.proposalId,
    })
  },
})

bindTriggerDevAdapter()

export { proposalGenerateJob as default }
