import { describe, expect, it } from 'vitest'
import {
  createOrganizationSchema,
  inviteMemberSchema,
  signUpSchema,
  slugifyOrganizationName,
} from './auth'

describe('auth schemas', () => {
  it('validates sign up input', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'Atlas User',
    })
    expect(result.success).toBe(true)
  })

  it('validates organization creation', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Atlas Solutions',
      slug: 'atlas-solutions',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Atlas Solutions',
      slug: 'Atlas Solutions',
    })
    expect(result.success).toBe(false)
  })

  it('validates invite member input', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'member@example.com',
      role: 'member',
    })
    expect(result.success).toBe(true)
  })
})

describe('slugifyOrganizationName', () => {
  it('creates URL-safe slug from name', () => {
    expect(slugifyOrganizationName('Atlas Sales OS')).toBe('atlas-sales-os')
  })

  it('trims leading and trailing separators', () => {
    expect(slugifyOrganizationName('  ---Hello World---  ')).toBe('hello-world')
  })
})
