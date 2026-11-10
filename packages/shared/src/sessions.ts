import { z } from 'zod'
import { PageQuerySchema } from './api'

// Session lifecycle: forward-only DRAFT -> PLAYED -> CLOSED. The transition
// table lives here so the API validates it and the UI can render only the
// actions that are actually allowed.
export const SessionStatusSchema = z.enum(['DRAFT', 'PLAYED', 'CLOSED'])
export type SessionStatus = z.infer<typeof SessionStatusSchema>

export const SESSION_NEXT_STATUS: Record<SessionStatus, SessionStatus | null> = {
  DRAFT: 'PLAYED',
  PLAYED: 'CLOSED',
  CLOSED: null,
}

export function canTransitionSession(from: SessionStatus, to: SessionStatus): boolean {
  return SESSION_NEXT_STATUS[from] === to
}

const SessionTitleSchema = z
  .string()
  .trim()
  .min(1, 'Session title is required')
  .max(200, 'Session title must be at most 200 characters')

// Same convention as campaign descriptions: trimmed, whitespace-only becomes ''
// (kept, not coerced to null) so PATCH can distinguish "clear" from "omitted".
const SessionSummarySchema = z
  .string()
  .trim()
  .max(8000, 'Session summary must be at most 8000 characters')

// Vault-relative path of the session note. Empty strings are rejected; callers
// that want to unlink the note send `null`.
const SessionNotePathSchema = z
  .string()
  .trim()
  .min(1, 'Session note path must not be empty')
  .max(500, 'Session note path must be at most 500 characters')

// ISO datetime strings (e.g. "2026-11-08T04:41:35.000Z").
const IsoDateTimeSchema = z.iso.datetime()

export const SessionCreateSchema = z.object({
  title: SessionTitleSchema,
  summary: SessionSummarySchema.nullable().optional(),
  playedAt: IsoDateTimeSchema.nullable().optional(),
  notePath: SessionNotePathSchema.nullable().optional(),
})
export type SessionCreate = z.infer<typeof SessionCreateSchema>

// PATCH body: every field optional, but an empty body is rejected. Status is
// NOT patchable: lifecycle changes go through the transition endpoint so an
// invalid jump returns 409 INVALID_TRANSITION instead of a generic update.
export const SessionUpdateSchema = z
  .object({
    title: SessionTitleSchema.optional(),
    summary: SessionSummarySchema.nullable().optional(),
    playedAt: IsoDateTimeSchema.nullable().optional(),
    notePath: SessionNotePathSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one field must be provided',
  })
export type SessionUpdate = z.infer<typeof SessionUpdateSchema>

export const SessionTransitionSchema = z.object({ status: SessionStatusSchema })
export type SessionTransition = z.infer<typeof SessionTransitionSchema>

export const SessionSchema = z.object({
  id: z.string().min(1),
  campaignId: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  summary: z.string().nullable(),
  playedAt: IsoDateTimeSchema.nullable(),
  status: SessionStatusSchema,
  notePath: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
})
export type Session = z.infer<typeof SessionSchema>

export const SessionListQuerySchema = PageQuerySchema.extend({
  status: SessionStatusSchema.optional(),
})
export type SessionListQuery = z.infer<typeof SessionListQuerySchema>

// Response of GET /campaigns/:campaignId/sessions/next-number: the number the
// next created session will receive (max(number) + 1 within the campaign).
export const NextSessionNumberSchema = z.object({ number: z.number().int().min(1) })
export type NextSessionNumber = z.infer<typeof NextSessionNumberSchema>
