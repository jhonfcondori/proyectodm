import { z } from 'zod'
import { PageQuerySchema } from './api'

export const CampaignStatusSchema = z.enum(['ACTIVE', 'ARCHIVED'])
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>

const CampaignNameSchema = z
  .string()
  .trim()
  .min(1, 'Campaign name is required')
  .max(120, 'Campaign name must be at most 120 characters')

// Description: trimmed like the name for coherence; an empty/whitespace-only
// string becomes '' (kept, not coerced to undefined/null) so PATCH can
// distinguish "clear to empty" from "field omitted", and POST stores '' as
// provided. Callers that want null to clear use `null` explicitly.
const CampaignDescriptionSchema = z
  .string()
  .trim()
  .max(4000, 'Campaign description must be at most 4000 characters')

export const CampaignCreateSchema = z.object({
  name: CampaignNameSchema,
  description: CampaignDescriptionSchema.nullable().optional(),
})
export type CampaignCreate = z.infer<typeof CampaignCreateSchema>

// PATCH body: every field optional, but an empty body is rejected so a PATCH
// always carries at least one change. description accepts null to clear it.
export const CampaignUpdateSchema = z
  .object({
    name: CampaignNameSchema.optional(),
    description: CampaignDescriptionSchema.nullable().optional(),
    status: CampaignStatusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one field must be provided',
  })
export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>

// ISO datetime strings (e.g. "2026-11-08T04:41:35.000Z").
const IsoDateTimeSchema = z.iso.datetime()

export const CampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  status: CampaignStatusSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
})
export type Campaign = z.infer<typeof CampaignSchema>

export const CampaignListQuerySchema = PageQuerySchema.extend({
  status: CampaignStatusSchema.optional(),
  q: z.string().max(120, 'Search query must be at most 120 characters').optional(),
})
export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>

export const CampaignDetailSchema = CampaignSchema.extend({
  sessionCount: z.number().int().min(0),
  entityCount: z.number().int().min(0),
})
export type CampaignDetail = z.infer<typeof CampaignDetailSchema>
