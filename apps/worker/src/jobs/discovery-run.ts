import { companyPipelineJobPayloadSchema, discoveryJobPayloadSchema } from '@atlas/types'
import { runCompanyPipeline, runCsvDiscovery } from '@atlas/discovery'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker pipeline jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const discoveryRunJob = createJob({
  id: 'discovery-run',
  description: 'Import companies from CSV for an ICP profile',
  schema: discoveryJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const { companyIds } = await runCsvDiscovery(client, payload)

    for (const companyId of companyIds) {
      await runCompanyPipeline(client, {
        organizationId: payload.organizationId,
        companyId,
      })
    }

    workerLogger.info('discovery-run completed', {
      event: 'company.discovered',
      organizationId: payload.organizationId,
      companyCount: companyIds.length,
    })
  },
})

export const companyPipelineJob = createJob({
  id: 'company-pipeline',
  description: 'Crawl, research, and enrich a single company',
  schema: companyPipelineJobPayloadSchema,
  retry: { maxAttempts: 3, factor: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    await runCompanyPipeline(client, payload)

    workerLogger.info('company-pipeline completed', {
      event: 'company.researched',
      organizationId: payload.organizationId,
      companyId: payload.companyId,
    })
  },
})

bindTriggerDevAdapter()

export { discoveryRunJob as default }
