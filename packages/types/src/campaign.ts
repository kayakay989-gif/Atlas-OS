import { z } from 'zod'
import { organizationIdSchema } from './common'

export const campaignStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled'])

export type CampaignStatus = z.infer<typeof campaignStatusSchema>

export const campaignContactStatusSchema = z.enum([
  'pending',
  'active',
  'replied',
  'bounced',
  'unsubscribed',
  'completed',
  'skipped',
])

export type CampaignContactStatus = z.infer<typeof campaignContactStatusSchema>

export const sendRecordStatusSchema = z.enum(['queued', 'sent', 'failed', 'skipped'])

export type SendRecordStatus = z.infer<typeof sendRecordStatusSchema>

export const replyIntentSchema = z.enum([
  'positive',
  'negative',
  'neutral',
  'out_of_office',
  'unsubscribe',
  'unknown',
])

export type ReplyIntent = z.infer<typeof replyIntentSchema>

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(80),
  sequenceId: z.string().uuid(),
  mailboxIds: z.array(z.string().uuid()).min(1),
  timezone: z.string().trim().min(1).max(64).default('UTC'),
  sendWindowStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Use HH:MM format')
    .default('09:00'),
  sendWindowEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Use HH:MM format')
    .default('17:00'),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>

export const campaignSendJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  campaignId: z.string().uuid(),
  batchSize: z.number().int().min(1).max(100).default(25),
})

export type CampaignSendJobPayload = z.infer<typeof campaignSendJobPayloadSchema>

export const campaignReplyCheckJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  campaignId: z.string().uuid().optional(),
})

export type CampaignReplyCheckJobPayload = z.infer<typeof campaignReplyCheckJobPayloadSchema>
