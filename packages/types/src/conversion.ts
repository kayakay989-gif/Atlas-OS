import { z } from 'zod'
import { organizationIdSchema } from './common'

export const proposalStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'sent',
  'rejected',
])

export type ProposalStatus = z.infer<typeof proposalStatusSchema>

export const invoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'cancelled'])

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

export const onboardingStatusSchema = z.enum(['pending', 'in_progress', 'completed'])

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>

export const createProposalSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  meetingId: z.string().uuid().optional(),
  amountCents: z.number().int().min(0).default(0),
  currency: z.string().length(3).default('USD'),
})

export type CreateProposalInput = z.infer<typeof createProposalSchema>

export const updateProposalSchema = z.object({
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(1).max(50000),
  amountCents: z.number().int().min(0),
})

export type UpdateProposalInput = z.infer<typeof updateProposalSchema>

export const reviewProposalSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
})

export type ReviewProposalInput = z.infer<typeof reviewProposalSchema>

export const proposalGenerateJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  proposalId: z.string().uuid(),
})

export type ProposalGenerateJobPayload = z.infer<typeof proposalGenerateJobPayloadSchema>
