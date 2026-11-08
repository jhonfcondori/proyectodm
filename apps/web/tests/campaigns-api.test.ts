import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../src/lib/api-client'
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from '../src/modules/campaigns/api'

const campaign = {
  id: 'c1',
  name: 'Cumbres de Sangre',
  description: 'Aventura en las montañas.',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const listPayload = {
  data: [campaign],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
}

const detailPayload = { data: { ...campaign, sessionCount: 3, entityCount: 12 } }

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listCampaigns', () => {
  it('builds the URL with page, limit, status and q in a stable order', async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await listCampaigns(
      { page: 2, limit: 10, status: 'ARCHIVED', q: 'mazmorra' },
      signal,
    )

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns?page=2&limit=10&status=ARCHIVED&q=mazmorra', {
      signal,
      headers: { Accept: 'application/json' },
    })
    expect(result.data).toEqual([campaign])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('omits empty params and uses the bare collection URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    await listCampaigns({ page: 1, q: '' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns?page=1', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
  })
})

describe('getCampaign', () => {
  it('requests the detail URL with the encoded id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detailPayload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getCampaign('c1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual(detailPayload.data)
  })
})

describe('createCampaign', () => {
  it('sends a POST with JSON body and headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: campaign }, 201))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createCampaign({ name: 'Cumbres de Sangre', description: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cumbres de Sangre', description: null }),
    })
    expect(result).toEqual(campaign)
  })

  it('propagates a 409 conflict with its backend code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'CONFLICT', message: 'A campaign with this name already exists' } },
          409,
        ),
      ),
    )

    const error = await createCampaign({ name: 'Duplicada' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    const apiError = error as ApiClientError
    expect(apiError.status).toBe(409)
    expect(apiError.code).toBe('CONFLICT')
    expect(apiError.message).toBe('A campaign with this name already exists')
  })
})

describe('updateCampaign', () => {
  it('sends a PATCH with the partial body to the item URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { ...campaign, status: 'ARCHIVED' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await updateCampaign('c1', { status: 'ARCHIVED' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1', {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    })
    expect(result.status).toBe('ARCHIVED')
  })
})

describe('deleteCampaign', () => {
  it('sends a DELETE to the item URL and returns the deleted id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 'c1' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteCampaign('c1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual({ id: 'c1' })
  })
})
