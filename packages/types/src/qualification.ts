import { z } from 'zod'
import { organizationIdSchema } from './common'

export const leadQualificationStatusSchema = z.enum(['pending', 'qualified', 'rejected'])

export type LeadQualificationStatus = z.infer<typeof leadQualificationStatusSchema>

export const leadScoreFactorSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
})

export type LeadScoreFactor = z.infer<typeof leadScoreFactorSchema>

export const leadScoreResultSchema = z.object({
  score: z.number().min(0).max(100),
  status: leadQualificationStatusSchema,
  reasoning: z.string().min(1),
  factors: z.array(leadScoreFactorSchema).min(1),
})

export type LeadScoreResult = z.infer<typeof leadScoreResultSchema>

export const outreachSettingsSchema = z.object({
  requireManualApproval: z.boolean().default(true),
  minQualificationScore: z.number().int().min(0).max(100).default(60),
})

export type OutreachSettingsInput = z.infer<typeof outreachSettingsSchema>

export const leadQualificationJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  companyId: z.string().uuid(),
})

export type LeadQualificationJobPayload = z.infer<typeof leadQualificationJobPayloadSchema>

export const outreachGenerationJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  companyId: z.string().uuid(),
})

export type OutreachGenerationJobPayload = z.infer<typeof outreachGenerationJobPayloadSchema>

export const postResearchPipelineJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  companyId: z.string().uuid(),
})

export type PostResearchPipelineJobPayload = z.infer<typeof postResearchPipelineJobPayloadSchema>
