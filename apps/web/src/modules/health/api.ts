import { HealthResponseSchema, type HealthResponse } from '@proyectodm/shared'
import { requestJson } from '../../lib/api-client'

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return requestJson('/api/v1/health', HealthResponseSchema, { signal })
}
