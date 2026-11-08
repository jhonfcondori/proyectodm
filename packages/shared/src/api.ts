import { z } from 'zod'

// Stable error codes exposed to API clients (English, machine-readable).
export const ApiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_TRANSITION',
  'VAULT_UNAVAILABLE',
  'INTERNAL_ERROR',
])
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>

// Pagination query params. Query strings arrive as strings, so coerce numbers
// before validating ranges. Defaults: page=1, limit=20, limit within 1..100.
export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PageQuery = z.infer<typeof PageQuerySchema>

export const ApiPaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})
export type ApiPaginationMeta = z.infer<typeof ApiPaginationMetaSchema>

// Route param for a resource id: cuid-like, non-empty string up to 64 chars.
export const IdParamSchema = z.string().min(1).max(64)
export type IdParam = z.infer<typeof IdParamSchema>
