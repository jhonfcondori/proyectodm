import { HealthResponseSchema, type HealthResponse } from '@proyectodm/shared'

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health', {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}`)
  }

  const rawBody = await response.text()

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new Error('La API devolvió una respuesta no válida')
  }

  const parsed = HealthResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error('La API devolvió una respuesta inesperada')
  }

  return parsed.data
}
