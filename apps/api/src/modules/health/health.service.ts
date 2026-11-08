import type { HealthCheck, HealthResponse } from '@proyectodm/shared'

export type DatabaseProbe = () => Promise<void>

export interface HealthDependencies {
  version: string
  probeDatabase: DatabaseProbe
  now?: () => Date
  uptime?: () => number
}

export async function checkHealth(deps: HealthDependencies): Promise<HealthResponse> {
  const now = deps.now ?? (() => new Date())
  const uptime = deps.uptime ?? (() => process.uptime())
  const startedAt = Date.now()

  let database: HealthCheck
  try {
    await deps.probeDatabase()
    database = { status: 'ok', latencyMs: Date.now() - startedAt }
  } catch (error) {
    console.error('Health check database probe failed', error)
    database = {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      message: 'database unavailable',
    }
  }

  return {
    status: database.status === 'ok' ? 'ok' : 'degraded',
    service: 'api',
    version: deps.version,
    uptimeSeconds: uptime(),
    timestamp: now().toISOString(),
    checks: { database },
  }
}
