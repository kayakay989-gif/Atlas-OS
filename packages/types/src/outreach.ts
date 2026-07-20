import { z } from 'zod'

export const emailDraftStatusSchema = z.enum(['draft', 'pending_review', 'approved', 'rejected'])

export type EmailDraftStatus = z.infer<typeof emailDraftStatusSchema>

export const qualityIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['warning', 'error']),
})

export type QualityIssue = z.infer<typeof qualityIssueSchema>

export const sequenceStepInputSchema = z.object({
  stepOrder: z.number().int().min(1),
  delayDays: z.number().int().min(0),
  subjectTemplate: z.string().trim().min(1).max(200),
  bodyTemplate: z.string().trim().min(1).max(5000),
})

export type SequenceStepInput = z.infer<typeof sequenceStepInputSchema>

export const emailSequenceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  isDefault: z.boolean().default(false),
  steps: z.array(sequenceStepInputSchema).min(3),
})

export type EmailSequenceInput = z.infer<typeof emailSequenceSchema>

export const generatedEmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
})

export type GeneratedEmail = z.infer<typeof generatedEmailSchema>

export const updateEmailDraftSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
})

export type UpdateEmailDraftInput = z.infer<typeof updateEmailDraftSchema>

export const reviewEmailDraftSchema = z.object({
  draftId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
})

export type ReviewEmailDraftInput = z.infer<typeof reviewEmailDraftSchema>
