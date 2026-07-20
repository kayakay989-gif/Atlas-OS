import { describe, expect, it } from 'vitest'
import { EVENT_TYPES, createDomainEvent } from './catalog'

describe('createDomainEvent', () => {
  it('creates a valid domain event', () => {
    const event = createDomainEvent({
      type: EVENT_TYPES.COMPANY_DISCOVERED,
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      payload: { companyId: 'abc' },
    })

    expect(event.type).toBe('company.discovered')
    expect(event.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(event.payload).toEqual({ companyId: 'abc' })
    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })
})
