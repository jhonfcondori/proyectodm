import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app'

const fixedTime = () => new Date('2026-01-01T00:00:00.000Z')

describe('GET /api/v1/health', () => {
  it('returns 200 when the database probe succeeds', async () => {
    const app = createApp({
      version: '0.1.0',
      probeDatabase: vi.fn().mockResolvedValue(undefined),
      now: fixedTime,
      uptime: () => 5,
    })

    const response = await request(app).get('/api/v1/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'api',
      version: '0.1.0',
      uptimeSeconds: 5,
      timestamp: '2026-01-01T00:00:00.000Z',
      checks: { database: { status: 'ok' } },
    })
  })

  it('returns 503 when the database probe fails', async () => {
    const app = createApp({
      version: '0.1.0',
      probeDatabase: vi.fn().mockRejectedValue(new Error('SQLITE_ERROR: no such table at L:\\fake\\path\\dev.db')),
      now: fixedTime,
      uptime: () => 5,
    })

    const response = await request(app).get('/api/v1/health')

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({
      status: 'degraded',
      checks: { database: { status: 'error', message: 'database unavailable' } },
    })
    expect(JSON.stringify(response.body)).not.toContain('SQLITE_ERROR')
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const app = createApp({
      version: '0.1.0',
      probeDatabase: vi.fn().mockResolvedValue(undefined),
      now: fixedTime,
      uptime: () => 5,
    })

    const response = await request(app).get('/api/v1/missing')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    })
  })
})
