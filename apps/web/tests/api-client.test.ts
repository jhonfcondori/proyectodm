import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiClientError, apiErrorMessage, isNotFound, requestJson } from '../src/lib/api-client'

const PayloadSchema = z.object({ id: z.string(), name: z.string() })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestJson', () => {
  it('returns the validated payload on a 200 with valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 'c1', name: 'Campaña demo' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const result = await requestJson('/api/v1/things', PayloadSchema)

    expect(result).toEqual({ id: 'c1', name: 'Campaña demo' })
    expect(fetch).toHaveBeenCalledWith('/api/v1/things', {
      headers: { Accept: 'application/json' },
    })
  })

  it('throws ApiClientError with the envelope code and message on a 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'VALIDATION_ERROR', message: 'El nombre es obligatorio' },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const error = await requestJson('/api/v1/things', PayloadSchema).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    const apiError = error as ApiClientError
    expect(apiError.status).toBe(400)
    expect(apiError.code).toBe('VALIDATION_ERROR')
    expect(apiError.message).toBe('El nombre es obligatorio')
    expect(isNotFound(apiError)).toBe(false)
  })

  it('falls back to a generic Spanish message on a 500 without envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      ),
    )

    const error = await requestJson('/api/v1/things', PayloadSchema).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    const apiError = error as ApiClientError
    expect(apiError.status).toBe(500)
    expect(apiError.code).toBe('INTERNAL_ERROR')
    expect(apiError.message).toBe('La API respondió 500')
  })

  it('throws ApiClientError when the body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>proxy error</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    const error = await requestJson('/api/v1/things', PayloadSchema).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    const apiError = error as ApiClientError
    expect(apiError.code).toBe('INVALID_RESPONSE')
    expect(apiError.message).toBe('La API devolvió una respuesta no válida')
  })

  it('throws ApiClientError when the payload fails the schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 42, name: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await requestJson('/api/v1/things', PayloadSchema).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiClientError)
    expect((error as ApiClientError).message).toBe('La API devolvió una respuesta inesperada')
  })

  it('marks 404 errors from the envelope as not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await requestJson('/api/v1/things', PayloadSchema).catch((e: unknown) => e)

    expect(isNotFound(error)).toBe(true)
  })

  it('merges caller headers and forwards the provided signal', async () => {
    const signal = new AbortController().signal
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1', name: 'x' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await requestJson('/api/v1/things', PayloadSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":"c1","name":"x"}',
      signal,
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/things', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{"id":"c1","name":"x"}',
      signal,
    })
  })
})

describe('apiErrorMessage', () => {
  it('translates known backend codes to Spanish', () => {
    const error = new ApiClientError(409, 'CONFLICT', 'A campaign with this name already exists')
    expect(apiErrorMessage(error)).toBe('Ya existe un registro con esos datos.')
  })

  it('keeps the raw message for unknown codes', () => {
    const error = new ApiClientError(418, 'TEAPOT', 'Something odd happened')
    expect(apiErrorMessage(error)).toBe('Something odd happened')
  })

  it('returns a Spanish network message for non-API errors', () => {
    expect(apiErrorMessage(new TypeError('fetch failed'))).toBe(
      'No se pudo conectar con la API. Comprueba que el servidor esté en marcha.',
    )
  })
})
