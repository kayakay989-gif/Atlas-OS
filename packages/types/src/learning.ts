import { z } from 'zod'
import { organizationIdSchema } from './common'

export const experimentStatusSchema = z.enum(['draft', 'running', 'completed', 'cancelled'])

export type ExperimentStatus = z.infer<typeof experimentStatusSchema>

export const experimentTypeSchema = z.enum(['subject_line', 'copy_variant', 'send_time'])

export type ExperimentType = z.infer<typeof experimentTypeSchema>

export const recommendationTypeSchema = z.enum(['icp_refinement', 'copy_pattern', 'send_time'])

export type RecommendationType = z.infer<typeof recommendationTypeSchema>

export const recommendationStatusSchema = z.enum(['pending', 'accepted', 'dismissed'])

export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>

export const contentFeedbackTypeSchema = z.enum(['email_draft', 'proposal'])

export type ContentFeedbackType = z.infer<typeof contentFeedbackTypeSchema>

export const createExperimentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  experimentType: experimentTypeSchema,
  campaignId: z.string().uuid().optional(),
  variants: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(20),
        subjectPattern: z.string().trim().optional(),
        bodyPattern: z.string().trim().optional(),
        sendHour: z.number().int().min(0).max(23).optional(),
      }),
    )
    .min(2)
    .max(4),
})

export type CreateExperimentInput = z.infer<typeof createExperimentSchema>

export const reviewRecommendationSchema = z.object({
  recommendationId: z.string().uuid(),
  decision: z.enum(['accepted', 'dismissed']),
})

export type ReviewRecommendationInput = z.infer<typeof reviewRecommendationSchema>

export const learningAnalyzeJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
})

export type LearningAnalyzeJobPayload = z.infer<typeof learningAnalyzeJobPayloadSchema>

export const campaignMetricsSchema = z.object({
  campaignId: z.string().uuid(),
  campaignName: z.string(),
  sends: z.number().int().min(0),
  replies: z.number().int().min(0),
  bounces: z.number().int().min(0),
  meetings: z.number().int().min(0),
  proposals: z.number().int().min(0),
  replyRate: z.number().min(0).max(1),
})

export type CampaignMetrics = z.infer<typeof campaignMetricsSchema>

export const abTestResultSchema = z.object({
  variantId: z.string().uuid(),
  label: z.string(),
  sends: z.number().int().min(0),
  replies: z.number().int().min(0),
  replyRate: z.number().min(0).max(1),
  isWinner: z.boolean().optional(),
  pValue: z.number().min(0).max(1).optional(),
  significant: z.boolean().optional(),
})

export type AbTestResult = z.infer<typeof abTestResultSchema>

export const recordContentEditSchema = z.object({
  contentType: contentFeedbackTypeSchema,
  sourceId: z.string().uuid(),
  originalSubject: z.string().optional(),
  originalBody: z.string().min(1),
  editedSubject: z.string().optional(),
  editedBody: z.string().min(1),
  promptVersion: z.string().default('v1'),
})

export type RecordContentEditInput = z.infer<typeof recordContentEditSchema>
