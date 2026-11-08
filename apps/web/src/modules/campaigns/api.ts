import { z } from 'zod'
import {
  ApiPaginationMetaSchema,
  CampaignDetailSchema,
  CampaignSchema,
  type ApiPaginationMeta,
  type Campaign,
  type CampaignCreate,
  type CampaignDetail,
  type CampaignStatus,
  type CampaignUpdate,
} from '@proyectodm/shared'
import { requestJson } from '../../lib/api-client'

// Backend envelopes: every campaigns route answers { data, meta? }.
const CampaignListResponseSchema = z.object({
  data: z.array(CampaignSchema),
  meta: ApiPaginationMetaSchema,
})
const CampaignResponseSchema = z.object({ data: CampaignSchema })
const CampaignDetailResponseSchema = z.object({ data: CampaignDetailSchema })
const DeleteCampaignResponseSchema = z.object({ data: z.object({ id: z.string().min(1) }) })

export interface CampaignListParams {
  page?: number
  limit?: number
  status?: CampaignStatus
  q?: string
}

export interface CampaignListResult {
  data: Campaign[]
  meta: ApiPaginationMeta
}

// Query string with only the provided params, in a stable order so list query
// keys stay deterministic for TanStack Query.
function toQueryString(params: CampaignListParams): string {
  const search = new URLSearchParams()
  if (params.page !== undefined) search.set('page', String(params.page))
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.status !== undefined) search.set('status', params.status)
  if (params.q !== undefined && params.q !== '') search.set('q', params.q)
  const query = search.toString()
  return query === '' ? '' : `?${query}`
}

export async function listCampaigns(
  params: CampaignListParams,
  signal?: AbortSignal,
): Promise<CampaignListResult> {
  return requestJson(`/api/v1/campaigns${toQueryString(params)}`, CampaignListResponseSchema, {
    signal,
  })
}

export async function getCampaign(id: string, signal?: AbortSignal): Promise<CampaignDetail> {
  const response = await requestJson(
    `/api/v1/campaigns/${encodeURIComponent(id)}`,
    CampaignDetailResponseSchema,
    { signal },
  )
  return response.data
}

export async function createCampaign(input: CampaignCreate): Promise<Campaign> {
  const response = await requestJson('/api/v1/campaigns', CampaignResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.data
}

export async function updateCampaign(id: string, input: CampaignUpdate): Promise<Campaign> {
  const response = await requestJson(
    `/api/v1/campaigns/${encodeURIComponent(id)}`,
    CampaignResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return response.data
}

export async function deleteCampaign(id: string): Promise<{ id: string }> {
  const response = await requestJson(
    `/api/v1/campaigns/${encodeURIComponent(id)}`,
    DeleteCampaignResponseSchema,
    { method: 'DELETE' },
  )
  return response.data
}
