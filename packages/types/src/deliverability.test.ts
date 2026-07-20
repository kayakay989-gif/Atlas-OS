import { describe, expect, it } from 'vitest'
import { addOutreachDomainSchema, addSuppressionEntrySchema } from './deliverability'

describe('addOutreachDomainSchema', () => {
  it('accepts valid domains', () => {
    const result = addOutreachDomainSchema.safeParse({ domain: 'mail.acme.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid domains', () => {
    const result = addOutreachDomainSchema.safeParse({ domain: 'not-a-domain' })
    expect(result.success).toBe(false)
  })
})

describe('addSuppressionEntrySchema', () => {
  it('defaults reason to manual', () => {
    const result = addSuppressionEntrySchema.parse({ email: 'blocked@example.com' })
    expect(result.reason).toBe('manual')
  })
})
