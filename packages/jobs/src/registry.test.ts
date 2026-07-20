import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { JobRegistry } from './registry'
import type { JobRuntimeAdapter, JobTriggerResult } from './types'

function createMockAdapter(): JobRuntimeAdapter & { triggers: unknown[] } {
  const triggers: unknown[] = []
  return {
    triggers,
    register: () => undefined,
    trigger: (jobId, payload): Promise<JobTriggerResult> => {
      triggers.push({ jobId, payload })
      return Promise.resolve({ runId: 'run-123' })
    },
  }
}

describe('JobRegistry', () => {
  it('validates payload with schema before trigger', async () => {
    const registry = new JobRegistry()
    const adapter = createMockAdapter()
    registry.bindAdapter(adapter)

    registry.register({
      id: 'test-job',
      schema: z.object({ organizationId: z.string().uuid() }),
      run: () => Promise.resolve(),
    })

    await expect(
      registry.trigger('test-job', { organizationId: 'invalid' }),
    ).rejects.toThrow('Invalid payload')
  })

  it('triggers adapter with valid payload', async () => {
    const registry = new JobRegistry()
    const adapter = createMockAdapter()
    registry.bindAdapter(adapter)

    const orgId = '550e8400-e29b-41d4-a716-446655440000'
    registry.register({
      id: 'test-job',
      schema: z.object({ organizationId: z.string().uuid() }),
      run: () => Promise.resolve(),
    })

    const result = await registry.trigger('test-job', { organizationId: orgId })
    expect(result.runId).toBe('run-123')
    expect(adapter.triggers).toHaveLength(1)
  })
})
