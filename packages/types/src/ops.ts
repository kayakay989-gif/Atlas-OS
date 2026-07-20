import { z } from 'zod'
import { organizationIdSchema } from './common'

export const alertSeveritySchema = z.enum(['info', 'warning', 'critical'])

export type AlertSeverity = z.infer<typeof alertSeveritySchema>

export const alertStatusSchema = z.enum(['open', 'acknowledged', 'resolved'])

export type AlertStatus = z.infer<typeof alertStatusSchema>

export const usageEventTypeSchema = z.enum([
  'email_sent',
  'meeting_booked',
  'proposal_sent',
  'invoice_paid',
  'discovery_run',
  'ai_generation',
])

export type UsageEventType = z.infer<typeof usageEventTypeSchema>

export const recordUsageEventSchema = z.object({
  eventType: usageEventTypeSchema,
  quantity: z.number().int().min(1).default(1),
  metadata: z.record(z.unknown()).optional(),
})

export type RecordUsageEventInput = z.infer<typeof recordUsageEventSchema>

export const opsMonitorJobPayloadSchema = z.object({
  organizationId: organizationIdSchema,
})

export type OpsMonitorJobPayload = z.infer<typeof opsMonitorJobPayloadSchema>

export const healthCheckResultSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  checks: z.record(
    z.object({
      status: z.enum(['ok', 'error', 'skipped']),
      latencyMs: z.number().optional(),
      message: z.string().optional(),
    }),
  ),
  timestamp: z.string(),
})

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>

export const acknowledgeAlertSchema = z.object({
  alertId: z.string().uuid(),
})

export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>
