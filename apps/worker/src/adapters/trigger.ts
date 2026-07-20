/**
 * Trigger.dev adapter — the ONLY module that imports @trigger.dev/sdk.
 * Replacing Trigger.dev requires changing this file and trigger.config.ts.
 */
import { task } from '@trigger.dev/sdk/v3'
import type {
  DefineJobConfig,
  JobDefinition,
  JobRuntimeAdapter,
  JobTriggerResult,
} from '@atlas/jobs'
import { jobRegistry, toJobDefinition } from '@atlas/jobs'

type TriggerTask = ReturnType<typeof task>

const triggerTasks = new Map<string, TriggerTask>()

function buildTriggerTask(job: JobDefinition): TriggerTask {
  return task({
    id: job.id,
    retry: job.retry
      ? {
          maxAttempts: job.retry.maxAttempts,
          factor: job.retry.factor ?? 2,
          minTimeoutInMs: job.retry.minTimeoutMs ?? 1000,
          maxTimeoutInMs: job.retry.maxTimeoutMs ?? 10000,
        }
      : undefined,
    run: async (payload: unknown) => {
      await job.run(payload)
    },
  })
}

export class TriggerDevAdapter implements JobRuntimeAdapter {
  register(job: JobDefinition): void {
    if (triggerTasks.has(job.id)) {
      return
    }
    triggerTasks.set(job.id, buildTriggerTask(job))
  }

  async trigger(jobId: string, payload: unknown): Promise<JobTriggerResult> {
    const triggerTask = triggerTasks.get(jobId)
    if (!triggerTask) {
      throw new Error(`Trigger.dev task not registered: ${jobId}`)
    }

    const handle = await triggerTask.trigger(payload)
    return { runId: handle.id }
  }
}

/**
 * Creates and registers a job in @atlas/jobs and exports a Trigger.dev task for discovery.
 * Use this in apps/worker/src/jobs/*.ts — never import @trigger.dev/sdk elsewhere.
 */
export function createJob<TPayload>(config: DefineJobConfig<TPayload>): TriggerTask {
  const job = toJobDefinition(config)
  jobRegistry.register(job)

  const existing = triggerTasks.get(job.id)
  if (existing) {
    return existing
  }

  const triggerTask = buildTriggerTask(job)
  triggerTasks.set(job.id, triggerTask)
  return triggerTask
}

export function bindTriggerDevAdapter(): TriggerDevAdapter {
  const adapter = new TriggerDevAdapter()
  jobRegistry.bindAdapter(adapter)

  for (const registeredJob of jobRegistry.listJobs()) {
    adapter.register(registeredJob)
  }

  return adapter
}
