import { describe, expect, it } from 'vitest'
import { healthCheckResultSchema, recordUsageEventSchema } from './ops'

describe('recordUsageEventSchema', () => {
  it('accepts email_sent events', () => {
    const result = recordUsageEventSchema.safeParse({ eventType: 'email_sent' })
    expect(result.success).toBe(true)
  })
})

describe('healthCheckResultSchema', () => {
  it('accepts ok status', () => {
    const result = healthCheckResultSchema.safeParse({
      status: 'ok',
      checks: { database: { status: 'ok', latencyMs: 12 } },
      timestamp: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })
})
