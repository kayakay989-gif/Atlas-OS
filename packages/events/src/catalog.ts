import { z } from 'zod'

export const domainEventBaseSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  organizationId: z.string().uuid(),
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
})

export type DomainEvent = z.infer<typeof domainEventBaseSchema>

/** Canonical event type constants — extend as milestones add capabilities */
export const EVENT_TYPES = {
  COMPANY_DISCOVERED: 'company.discovered',
  COMPANY_RESEARCHED: 'company.researched',
  LEAD_QUALIFIED: 'lead.qualified',
  LEAD_REJECTED: 'lead.rejected',
  OUTREACH_GENERATED: 'outreach.generated',
  OUTREACH_APPROVED: 'outreach.approved',
  EMAIL_SENT: 'email.sent',
  EMAIL_BOUNCED: 'email.bounced',
  REPLY_RECEIVED: 'reply.received',
  MEETING_BOOKED: 'meeting.booked',
  PROPOSAL_APPROVED: 'proposal.approved',
  CAMPAIGN_COMPLETED: 'campaign.completed',
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export function createDomainEvent(input: {
  type: EventType
  organizationId: string
  payload: Record<string, unknown>
}): DomainEvent {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    organizationId: input.organizationId,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  }
}
