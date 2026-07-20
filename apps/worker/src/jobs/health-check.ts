import { healthCheckJobPayloadSchema } from '@atlas/types/jobs'
import { bindTriggerDevAdapter, createJob } from '../adapters/trigger'
import { workerLogger } from '../lib/logger'

/** Example job — validates M0 worker + @atlas/jobs abstraction */
export const healthCheckJob = createJob({
  id: 'health-check',
  description: 'Validates worker runtime and job payload schema',
  schema: healthCheckJobPayloadSchema,
  retry: { maxAttempts: 3, factor: 2 },
  run: (payload) => {
    workerLogger.info('health-check completed', {
      event: 'worker.health_check',
      organizationId: payload.organizationId,
      message: payload.message,
    })
    return Promise.resolve()
  },
})

bindTriggerDevAdapter()

export { healthCheckJob as default }
