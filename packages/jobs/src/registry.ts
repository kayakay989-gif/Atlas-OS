import { ValidationError } from '@atlas/shared'
import type {
  DefineJobConfig,
  JobDefinition,
  JobRuntime,
  JobRuntimeAdapter,
  JobTriggerResult,
} from './types'
import { toJobDefinition } from './types'

export class JobRegistry implements JobRuntime {
  private readonly jobs = new Map<string, JobDefinition>()
  private adapter: JobRuntimeAdapter | null = null

  register(job: JobDefinition): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job already registered: ${job.id}`)
    }
    this.jobs.set(job.id, job)
    this.adapter?.register(job)
  }

  bindAdapter(adapter: JobRuntimeAdapter): void {
    this.adapter = adapter
    for (const registeredJob of this.jobs.values()) {
      adapter.register(registeredJob)
    }
  }

  getJob(id: string): JobDefinition | undefined {
    return this.jobs.get(id)
  }

  listJobs(): JobDefinition[] {
    return [...this.jobs.values()]
  }

  async trigger(jobId: string, payload: unknown): Promise<JobTriggerResult> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new ValidationError(`Unknown job: ${jobId}`)
    }

    if (job.schema) {
      const parsed = job.schema.safeParse(payload)
      if (!parsed.success) {
        throw new ValidationError(`Invalid payload for job ${jobId}: ${parsed.error.message}`)
      }
    }

    if (!this.adapter) {
      throw new Error('Job runtime adapter not bound. Is the worker running?')
    }

    return this.adapter.trigger(jobId, payload)
  }
}

/** Singleton registry used by worker adapter and future enqueue callers */
export const jobRegistry = new JobRegistry()

export function defineJob<TPayload>(config: DefineJobConfig<TPayload>): JobDefinition {
  const job = toJobDefinition(config)
  jobRegistry.register(job)
  return job
}

export async function enqueueJob(jobId: string, payload: unknown): Promise<JobTriggerResult> {
  return jobRegistry.trigger(jobId, payload)
}

export { toJobDefinition }
