import { z } from 'zod'

// Error thrown for any non-successful or unexpected API response. `code` is a
// stable machine-readable string: the backend envelope code when present, or
// a client-side fallback code (`INVALID_RESPONSE`, `INTERNAL_ERROR`, ...) when
// the body carries no envelope.
export class ApiClientError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
  }
}

// Lenient version of the shared ApiErrorSchema: any non-empty code/message is
// accepted so a future backend code still surfaces in the UI instead of being
// swallowed by the fallback message.
const ErrorEnvelopeSchema = z.object({
  error: z.object({ code: z.string().min(1), message: z.string().min(1) }),
})

// Spanish copy for the stable backend codes. The API returns English messages,
// so the UI prefers this mapping and falls back to the raw message for
// unknown/future codes.
const spanishMessagesByCode: Record<string, string> = {
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  NOT_FOUND: 'No se encontró el recurso solicitado.',
  CONFLICT: 'Ya existe un registro con esos datos.',
  INVALID_TRANSITION: 'La operación no está permitida en el estado actual.',
  VAULT_UNAVAILABLE: 'El vault de Obsidian no está disponible.',
  INTERNAL_ERROR: 'Error interno del servidor.',
}

function fallbackCodeForStatus(status: number): string {
  if (status === 400) return 'VALIDATION_ERROR'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  return 'INTERNAL_ERROR'
}

function mergeHeaders(init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const extra = init?.headers
  if (!extra) return headers
  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }
  if (Array.isArray(extra)) {
    for (const [key, value] of extra) headers[key] = value
    return headers
  }
  Object.assign(headers, extra)
  return headers
}

function isErrorEnvelope(payload: unknown): payload is { error: { code: string; message: string } } {
  return ErrorEnvelopeSchema.safeParse(payload).success
}

// Fetches `path`, validates the JSON body with `schema` and throws
// ApiClientError carrying the backend `{ error: { code, message } }` envelope
// whenever the response is not OK.
export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, { ...init, headers: mergeHeaders(init) })
  const rawBody = await response.text()

  let payload: unknown
  let isJson = true
  try {
    payload = JSON.parse(rawBody)
  } catch {
    isJson = false
    payload = undefined
  }

  if (!response.ok) {
    if (isJson && isErrorEnvelope(payload)) {
      throw new ApiClientError(response.status, payload.error.code, payload.error.message)
    }
    throw new ApiClientError(
      response.status,
      fallbackCodeForStatus(response.status),
      `La API respondió ${response.status}`,
    )
  }

  if (!isJson) {
    throw new ApiClientError(
      response.status,
      'INVALID_RESPONSE',
      'La API devolvió una respuesta no válida',
    )
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new ApiClientError(
      response.status,
      'INVALID_RESPONSE',
      'La API devolvió una respuesta inesperada',
    )
  }
  return parsed.data
}

// Spanish, user-facing message for any error thrown by requestJson (or by the
// network layer before it reached the API).
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return spanishMessagesByCode[error.code] ?? error.message
  }
  return 'No se pudo conectar con la API. Comprueba que el servidor esté en marcha.'
}

// True when the API answered404 for this error (missing resource).
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && (error.status === 404 || error.code === 'NOT_FOUND')
}
