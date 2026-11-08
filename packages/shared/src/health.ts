import { z } from 'zod'

export const HealthStatusSchema = z.enum(['ok', 'degraded'])
export type HealthStatus = z.infer<typeof HealthStatusSchema>

export const HealthCheckSchema = z.object({
  status: z.enum(['ok', 'error']),
  latencyMs: z.number().nonnegative().optional(),
  message: z.string().optional(),
})
export type HealthCheck = z.infer<typeof HealthCheckSchema>

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  service: z.literal('api'),
  version: z.string().min(1),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
  checks: z.object({
    database: HealthCheckSchema,
  }),
})
export type HealthResponse = z.infer<typeof HealthResponseSchema>
