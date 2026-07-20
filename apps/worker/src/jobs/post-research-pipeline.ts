import {
  leadQualificationJobPayloadSchema,
  outreachGenerationJobPayloadSchema,
  postResearchPipelineJobPayloadSchema,
} from '@atlas/types'
import { runLeadQualification } from '@atlas/qualification'
import { generateOutreachDrafts, runPostResearchPipeline } from '@atlas/outreach'
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

export const leadQualificationJob = createJob({
  id: 'lead-qualification',
  description: 'Score and qualify a researched company',
  schema: leadQualificationJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const result = await runLeadQualification(client, payload)

    workerLogger.info('lead-qualification completed', {
      event: result.status === 'qualified' ? 'lead.qualified' : 'lead.rejected',
      organizationId: payload.organizationId,
      companyId: payload.companyId,
      score: result.score,
    })
  },
})

export const outreachGenerationJob = createJob({
  id: 'outreach-generation',
  description: 'Generate outreach email drafts for a qualified lead',
  schema: outreachGenerationJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    const { draftCount } = await generateOutreachDrafts(client, payload)

    workerLogger.info('outreach-generation completed', {
      event: 'outreach.generated',
      organizationId: payload.organizationId,
      companyId: payload.companyId,
      draftCount,
    })
  },
})

export const postResearchPipelineJob = createJob({
  id: 'post-research-pipeline',
  description: 'Qualify a lead and generate outreach drafts when qualified',
  schema: postResearchPipelineJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    await runPostResearchPipeline(client, payload)

    workerLogger.info('post-research-pipeline completed', {
      organizationId: payload.organizationId,
      companyId: payload.companyId,
    })
  },
})

bindTriggerDevAdapter()

export { postResearchPipelineJob as default }
