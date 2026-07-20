import { meetingBriefGenerateJobPayloadSchema } from '@atlas/types'
import { generateMeetingBrief, sendMeetingConfirmations } from '@atlas/meetings'
import { createJob, bindTriggerDevAdapter } from '../adapters/trigger'
import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'
import { workerLogger } from '../lib/logger'

function getServiceClient() {
  const config = getSupabaseConfigFromEnv(process.env)
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY required for worker meeting jobs')
  }
  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export const meetingBriefGenerateJob = createJob({
  id: 'meeting-brief-generate',
  description: 'Generate a pre-meeting brief from research and reply history',
  schema: meetingBriefGenerateJobPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload) => {
    const client = getServiceClient()
    await generateMeetingBrief(client, {
      organizationId: payload.organizationId,
      meetingId: payload.meetingId,
    })
    await sendMeetingConfirmations(client, {
      organizationId: payload.organizationId,
      meetingId: payload.meetingId,
    })

    workerLogger.info('meeting-brief-generate completed', {
      organizationId: payload.organizationId,
      meetingId: payload.meetingId,
    })
  },
})

bindTriggerDevAdapter()

export { meetingBriefGenerateJob as default }
