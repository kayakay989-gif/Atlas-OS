import { describe, expect, it } from 'vitest'
import { organizationIdSchema } from './common'

describe('organizationIdSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = organizationIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    const result = organizationIdSchema.safeParse('not-a-uuid')
    expect(result.success).toBe(false)
  })
})
