import { learningAnalyzeJobPayloadSchema } from '@atlas/types'
import { runLearningAnalysis } from '@atlas/learning'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker learning jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const learningAnalyzeJob = createJob({
  id: 'learning-analyze',
  description: 'Analyze campaign performance and generate optimization recommendations',
  schema: learningAnalyzeJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const result = await runLearningAnalysis(client, payload.organizationId)

    workerLogger.info('learning-analyze completed', {
      organizationId: payload.organizationId,
      recommendationsCreated: result.recommendationsCreated,
    })
  },
})

bindTriggerDevAdapter()

export { learningAnalyzeJob as default }
