import { z } from 'zod'
import {
  ApiPaginationMetaSchema,
  NextSessionNumberSchema,
  SessionSchema,
  type ApiPaginationMeta,
  type NextSessionNumber,
  type Session,
  type SessionCreate,
  type SessionStatus,
  type SessionUpdate,
} from '@proyectodm/shared'
import { requestJson } from '../../lib/api-client'

// Backend envelopes: list answers { data, meta }, the rest { data }.
const SessionListResponseSchema = z.object({
  data: z.array(SessionSchema),
  meta: ApiPaginationMetaSchema,
})
const SessionResponseSchema = z.object({ data: SessionSchema })
const NextSessionNumberResponseSchema = z.object({ data: NextSessionNumberSchema })
const DeleteSessionResponseSchema = z.object({ data: z.object({ id: z.string().min(1) }) })

export interface SessionListParams {
  page?: number
  limit?: number
  status?: SessionStatus
}

export interface SessionListResult {
  data: Session[]
  meta: ApiPaginationMeta
}

// Stable param order so list query keys stay deterministic for TanStack Query.
function toQueryString(params: SessionListParams): string {
  const search = new URLSearchParams()
  if (params.page !== undefined) search.set('page', String(params.page))
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.status !== undefined) search.set('status', params.status)
  const query = search.toString()
  return query === '' ? '' : `?${query}`
}

export async function listSessions(
  campaignId: string,
  params: SessionListParams,
  signal?: AbortSignal,
): Promise<SessionListResult> {
  return requestJson(
    `/api/v1/campaigns/${encodeURIComponent(campaignId)}/sessions${toQueryString(params)}`,
    SessionListResponseSchema,
    { signal },
  )
}

export async function getNextSessionNumber(
  campaignId: string,
  signal?: AbortSignal,
): Promise<NextSessionNumber> {
  const response = await requestJson(
    `/api/v1/campaigns/${encodeURIComponent(campaignId)}/sessions/next-number`,
    NextSessionNumberResponseSchema,
    { signal },
  )
  return response.data
}

export async function createSession(
  campaignId: string,
  input: SessionCreate,
): Promise<Session> {
  const response = await requestJson(
    `/api/v1/campaigns/${encodeURIComponent(campaignId)}/sessions`,
    SessionResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return response.data
}

export async function getSession(id: string, signal?: AbortSignal): Promise<Session> {
  const response = await requestJson(
    `/api/v1/sessions/${encodeURIComponent(id)}`,
    SessionResponseSchema,
    { signal },
  )
  return response.data
}

export async function updateSession(id: string, input: SessionUpdate): Promise<Session> {
  const response = await requestJson(
    `/api/v1/sessions/${encodeURIComponent(id)}`,
    SessionResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return response.data
}

export async function transitionSession(
  id: string,
  status: SessionStatus,
): Promise<Session> {
  const response = await requestJson(
    `/api/v1/sessions/${encodeURIComponent(id)}/transition`,
    SessionResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  )
  return response.data
}

export async function deleteSession(id: string): Promise<{ id: string }> {
  const response = await requestJson(
    `/api/v1/sessions/${encodeURIComponent(id)}`,
    DeleteSessionResponseSchema,
    { method: 'DELETE' },
  )
  return response.data
}
