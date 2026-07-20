import { describe, expect, it } from 'vitest'
import { healthCheckJobPayloadSchema } from './jobs'

describe('healthCheckJobPayloadSchema', () => {
  it('accepts valid payload', () => {
    const result = healthCheckJobPayloadSchema.safeParse({
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'hello',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid organization id', () => {
    const result = healthCheckJobPayloadSchema.safeParse({
      organizationId: 'not-a-uuid',
      message: 'hello',
    })
    expect(result.success).toBe(false)
  })
})
