import { z } from 'zod'
import { organizationIdSchema } from './common'

export const domainVerificationStatusSchema = z.enum(['pending', 'verified', 'failed'])

export type DomainVerificationStatus = z.infer<typeof domainVerificationStatusSchema>

export const mailboxProviderSchema = z.enum(['google_workspace', 'smtp'])

export type MailboxProvider = z.infer<typeof mailboxProviderSchema>

export const mailboxStatusSchema = z.enum(['warming', 'active', 'paused', 'disabled'])

export type MailboxStatus = z.infer<typeof mailboxStatusSchema>

export const suppressionReasonSchema = z.enum([
  'hard_bounce',
  'soft_bounce',
  'unsubscribe',
  'manual',
  'complaint',
])

export type SuppressionReason = z.infer<typeof suppressionReasonSchema>

export const addOutreachDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Enter a valid domain like mail.example.com'),
  dkimSelector: z.string().trim().min(1).max(63).default('default'),
})

export type AddOutreachDomainInput = z.infer<typeof addOutreachDomainSchema>

export const addMailboxSchema = z.object({
  domainId: z.string().uuid(),
  emailAddress: z.string().email(),
  displayName: z.string().trim().max(80).optional(),
  provider: mailboxProviderSchema.default('google_workspace'),
})

export type AddMailboxInput = z.infer<typeof addMailboxSchema>

export const addSuppressionEntrySchema = z.object({
  email: z.string().email(),
  reason: suppressionReasonSchema.default('manual'),
  notes: z.string().trim().max(500).optional(),
})

export type AddSuppressionEntryInput = z.infer<typeof addSuppressionEntrySchema>

export const dnsValidationResultSchema = z.object({
  spfValid: z.boolean(),
  dkimValid: z.boolean(),
  dmarcValid: z.boolean(),
  records: z.object({
    spf: z.array(z.string()),
    dkim: z.array(z.string()),
    dmarc: z.array(z.string()),
  }),
})

export type DnsValidationResult = z.infer<typeof dnsValidationResultSchema>

export const preSendCheckInputSchema = z.object({
  recipientEmail: z.string().email(),
  fromEmail: z.string().email(),
  bodyHtml: z.string().min(1),
  unsubscribeUrl: z.string().url().optional(),
  organizationId: organizationIdSchema,
})

export type PreSendCheckInput = z.infer<typeof preSendCheckInputSchema>

export const preSendCheckFailureSchema = z.object({
  rule: z.string().min(1),
  message: z.string().min(1),
})

export type PreSendCheckFailure = z.infer<typeof preSendCheckFailureSchema>

export const domainDnsCheckJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  domainId: z.string().uuid(),
})

export type DomainDnsCheckJobPayload = z.infer<typeof domainDnsCheckJobPayloadSchema>
