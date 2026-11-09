import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../src/lib/api-client'
import {
  createSession,
  deleteSession,
  getNextSessionNumber,
  getSession,
  listSessions,
  transitionSession,
  updateSession,
} from '../src/modules/sessions/api'

const session = {
  id: 's1',
  campaignId: 'c1',
  number: 3,
  title: 'La cripta',
  summary: 'El grupo entra en la cripta.',
  playedAt: '2026-01-01T20:00:00.000Z',
  status: 'DRAFT',
  notePath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const listPayload = {
  data: [session],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listSessions', () => {
  it('builds the campaign-scoped URL with page, limit and status', async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await listSessions('c1', { page: 2, limit: 10, status: 'PLAYED' }, signal)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/campaigns/c1/sessions?page=2&limit=10&status=PLAYED',
      { signal, headers: { Accept: 'application/json' } },
    )
    expect(result.data).toEqual([session])
    expect(result.meta.total).toBe(1)
  })

  it('omits the query string when no params are given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    await listSessions('c1', {})

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1/sessions', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
  })

  it('encodes the campaign id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    await listSessions('a/b', {})

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/a%2Fb/sessions', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
  })
})

describe('getNextSessionNumber', () => {
  it('requests the next-number endpoint and unwraps data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { number: 4 } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getNextSessionNumber('c1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1/sessions/next-number', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual({ number: 4 })
  })
})

describe('createSession', () => {
  it('sends a POST with JSON body and headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: session }, 201))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createSession('c1', { title: 'La cripta', summary: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/campaigns/c1/sessions', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'La cripta', summary: null }),
    })
    expect(result).toEqual(session)
  })
})

describe('getSession', () => {
  it('requests the item URL with the encoded id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: session }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getSession('s/1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s%2F1', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual(session)
  })
})

describe('updateSession', () => {
  it('sends a PATCH with the partial body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { ...session, title: 'Nuevo' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await updateSession('s1', { title: 'Nuevo', playedAt: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s1', {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nuevo', playedAt: null }),
    })
    expect(result.title).toBe('Nuevo')
  })
})

describe('transitionSession', () => {
  it('posts the target status to the transition endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { ...session, status: 'PLAYED' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await transitionSession('s1', 'PLAYED')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s1/transition', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PLAYED' }),
    })
    expect(result.status).toBe('PLAYED')
  })

  it('propagates INVALID_TRANSITION with its backend code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'INVALID_TRANSITION',
              message: 'Cannot transition a session from DRAFT to CLOSED',
            },
          },
          409,
        ),
      ),
    )

    const error = await transitionSession('s1', 'CLOSED').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    expect((error as ApiClientError).status).toBe(409)
    expect((error as ApiClientError).code).toBe('INVALID_TRANSITION')
  })
})

describe('deleteSession', () => {
  it('sends a DELETE and returns the deleted id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 's1' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await deleteSession('s1')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s1', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual({ id: 's1' })
  })
})
