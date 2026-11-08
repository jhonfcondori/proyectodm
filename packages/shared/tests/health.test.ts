import { describe, expect, it } from 'vitest'
import { HealthResponseSchema } from '../src/index'

describe('HealthResponseSchema', () => {
  it('accepts a healthy API response', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'ok',
      service: 'api',
      version: '0.1.0',
      uptimeSeconds: 12.5,
      timestamp: '2026-01-01T00:00:00.000Z',
      checks: { database: { status: 'ok', latencyMs: 2 } },
    })

    expect(result.success).toBe(true)
  })

  it('rejects a response without the database check', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'ok',
      service: 'api',
      version: '0.1.0',
      uptimeSeconds: 0,
      timestamp: '2026-01-01T00:00:00.000Z',
      checks: {},
    })

    expect(result.success).toBe(false)
  })
})
