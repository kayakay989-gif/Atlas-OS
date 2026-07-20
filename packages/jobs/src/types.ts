import type { z } from 'zod'

export interface JobRetryConfig {
  maxAttempts: number
  factor?: number
  minTimeoutMs?: number
  maxTimeoutMs?: number
}

export interface JobDefinition {
  id: string
  description?: string
  schema?: z.ZodType
  retry?: JobRetryConfig
  run: (payload: unknown) => Promise<void>
}

export interface JobTriggerResult {
  runId: string
}

export interface DefineJobConfig<TPayload> {
  id: string
  description?: string
  schema?: z.ZodType<TPayload>
  retry?: JobRetryConfig
  run: (payload: TPayload) => Promise<void>
}

/** Runtime adapter interface — implemented by Trigger.dev adapter in apps/worker */
export interface JobRuntimeAdapter {
  register(job: JobDefinition): void
  trigger(jobId: string, payload: unknown): Promise<JobTriggerResult>
}

export interface JobRuntime {
  register(job: JobDefinition): void
  trigger(jobId: string, payload: unknown): Promise<JobTriggerResult>
  getJob(id: string): JobDefinition | undefined
  listJobs(): JobDefinition[]
}

export function toJobDefinition<TPayload>(config: DefineJobConfig<TPayload>): JobDefinition {
  return {
    id: config.id,
    description: config.description,
    schema: config.schema,
    retry: config.retry,
    run: async (payload: unknown) => {
      if (config.schema) {
        const parsed = config.schema.parse(payload)
        await config.run(parsed)
        return
      }
      await config.run(payload as TPayload)
    },
  }
}
