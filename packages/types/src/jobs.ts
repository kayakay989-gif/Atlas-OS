import { z } from 'zod'
import { organizationIdSchema } from './common'

export { organizationIdSchema }

export const jobPayloadBaseSchema = z.object({
  organizationId: organizationIdSchema,
})

export type JobPayloadBase = z.infer<typeof jobPayloadBaseSchema>

export const healthCheckJobPayloadSchema = jobPayloadBaseSchema.extend({
  message: z.string().min(1).max(500),
})

export type HealthCheckJobPayload = z.infer<typeof healthCheckJobPayloadSchema>
