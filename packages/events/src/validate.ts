import { domainEventBaseSchema, type EventType } from './catalog'

export function parseDomainEvent(value: unknown) {
  return domainEventBaseSchema.safeParse(value)
}

export function createValidatedDomainEvent(input: {
  type: EventType
  organizationId: string
  payload: Record<string, unknown>
}) {
  const event = {
    id: crypto.randomUUID(),
    type: input.type,
    organizationId: input.organizationId,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  }

  const parsed = domainEventBaseSchema.parse(event)
  return parsed
}
