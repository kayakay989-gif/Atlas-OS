import { z } from 'zod'
import { organizationIdSchema } from './common'

export const icpProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  industries: z.array(z.string().trim().min(1)).default([]),
  geographies: z.array(z.string().trim().min(1)).default([]),
  companySizeMin: z.number().int().min(0).optional(),
  companySizeMax: z.number().int().min(0).optional(),
  keywords: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().default(true),
})

export type IcpProfileInput = z.infer<typeof icpProfileSchema>

export const csvDiscoveryRowSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().optional(),
  websiteUrl: z.string().url().optional(),
})

export type CsvDiscoveryRow = z.infer<typeof csvDiscoveryRowSchema>

export const researchBrandingSchema = z.object({
  tone: z.string(),
  visualStyle: z.string(),
  keyMessages: z.array(z.string()),
})

export const researchUxSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
})

export const researchPositioningSchema = z.object({
  marketSegment: z.string(),
  valueProposition: z.string(),
  competitors: z.array(z.string()),
})

export const suggestedContactSchema = z.object({
  fullName: z.string(),
  email: z.string().email().optional(),
  title: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
})

export const researchReportSchema = z.object({
  summary: z.string().min(1),
  branding: researchBrandingSchema,
  uxAnalysis: researchUxSchema,
  positioning: researchPositioningSchema,
  painPoints: z.array(z.string()),
  suggestedContacts: z.array(suggestedContactSchema).default([]),
})

export type ResearchReport = z.infer<typeof researchReportSchema>

export const discoveryJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  icpProfileId: z.string().uuid(),
  csvContent: z.string().min(1),
})

export type DiscoveryJobPayload = z.infer<typeof discoveryJobPayloadSchema>

export const companyPipelineJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
  companyId: z.string().uuid(),
})

export type CompanyPipelineJobPayload = z.infer<typeof companyPipelineJobPayloadSchema>
