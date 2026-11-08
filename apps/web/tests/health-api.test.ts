import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth } from '../src/modules/health/api'

const validHealthPayload = {
  status: 'ok',
  service: 'api',
  version: '0.1.0',
  uptimeSeconds: 12.5,
  timestamp: '2026-01-01T00:00:00.000Z',
  checks: { database: { status: 'ok', latencyMs: 2 } },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchHealth', () => {
  it('returns the parsed payload on a 200 with valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(validHealthPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const result = await fetchHealth()

    expect(result).toEqual(validHealthPayload)
    expect(fetch).toHaveBeenCalledWith('/api/v1/health', {
      signal: undefined,
      headers: { Accept: 'application/json' },
    })
  })

  it('throws a Spanish error including the status on a 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      ),
    )

    await expect(fetchHealth()).rejects.toThrow('La API respondió 500')
  })

  it('throws an error when a 200 body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>proxy error</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    await expect(fetchHealth()).rejects.toThrow(
      'La API devolvió una respuesta no válida',
    )
  })

  it('rejects syntactically valid JSON that fails the schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'weird' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchHealth()).rejects.toThrow(
      'La API devolvió una respuesta inesperada',
    )
  })

  it('forwards the provided AbortSignal to fetch', async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validHealthPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchHealth(signal)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/health', {
      signal,
      headers: { Accept: 'application/json' },
    })
    expect(fetchMock.mock.calls[0][1].signal).toBe(signal)
  })
})
