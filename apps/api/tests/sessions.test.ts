import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app'
import { createTestDatabase, type TestDatabase } from './helpers/test-db'

let testDb: TestDatabase
let app: ReturnType<typeof createApp>

beforeAll(async () => {
  testDb = createTestDatabase()
  app = createApp({
    version: '0.1.0',
    probeDatabase: vi.fn().mockResolvedValue(undefined),
    now: () => new Date('2026-01-01T00:00:00.000Z'),
    uptime: () => 5,
    prisma: testDb.prisma,
  })
}, 60_000)

afterAll(async () => {
  await testDb.cleanup()
})

beforeEach(async () => {
  await testDb.prisma.entity.deleteMany()
  await testDb.prisma.session.deleteMany()
  await testDb.prisma.campaign.deleteMany()
})

async function createCampaign(name = 'Dragon Heist'): Promise<string> {
  const response = await request(app).post('/api/v1/campaigns').send({ name })
  expect(response.status).toBe(201)
  return response.body.data.id as string
}

async function createSession(
  campaignId: string,
  body: Record<string, unknown> = { title: 'La cripta' },
): Promise<request.Response> {
  return request(app).post(`/api/v1/campaigns/${campaignId}/sessions`).send(body)
}

describe('GET /api/v1/campaigns/:campaignId/sessions', () => {
  it('returns an empty list with correct meta', async () => {
    const campaignId = await createCampaign()

    const response = await request(app).get(`/api/v1/campaigns/${campaignId}/sessions`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
    expect(response.body.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 })
  })

  it('returns 404 NOT_FOUND for an unknown campaign', async () => {
    const response = await request(app).get('/api/v1/campaigns/does-not-exist/sessions')

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Campaign not found' })
  })

  it('lists sessions in number order with pagination', async () => {
    const campaignId = await createCampaign()
    await createSession(campaignId, { title: 'Primera' })
    await createSession(campaignId, { title: 'Segunda' })
    await createSession(campaignId, { title: 'Tercera' })

    const page2 = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions?page=2&limit=2`,
    )

    expect(page2.status).toBe(200)
    expect(page2.body.data).toHaveLength(1)
    expect(page2.body.data[0]).toMatchObject({ number: 3, title: 'Tercera' })
    expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 })
  })

  it('filters by status', async () => {
    const campaignId = await createCampaign()
    const draft = await createSession(campaignId, { title: 'Borrador' })
    const played = await createSession(campaignId, { title: 'Jugada' })
    await request(app)
      .post(`/api/v1/sessions/${played.body.data.id}/transition`)
      .send({ status: 'PLAYED' })

    const drafts = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions?status=DRAFT`,
    )
    const playedList = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions?status=PLAYED`,
    )

    expect(drafts.body.data).toHaveLength(1)
    expect(drafts.body.data[0].id).toBe(draft.body.data.id)
    expect(playedList.body.data).toHaveLength(1)
    expect(playedList.body.data[0].id).toBe(played.body.data.id)
  })

  it('does not leak sessions from another campaign', async () => {
    const first = await createCampaign('First')
    const second = await createCampaign('Second')
    await createSession(first, { title: 'Only in first' })

    const response = await request(app).get(`/api/v1/campaigns/${second}/sessions`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
  })

  it('returns 400 VALIDATION_ERROR for an invalid status filter', async () => {
    const campaignId = await createCampaign()

    const response = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions?status=CANCELLED`,
    )

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('GET /api/v1/campaigns/:campaignId/sessions/next-number', () => {
  it('returns 1 for an empty campaign and increments with each session', async () => {
    const campaignId = await createCampaign()

    const first = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions/next-number`,
    )
    expect(first.status).toBe(200)
    expect(first.body.data).toEqual({ number: 1 })

    await createSession(campaignId, { title: 'Primera' })

    const second = await request(app).get(
      `/api/v1/campaigns/${campaignId}/sessions/next-number`,
    )
    expect(second.body.data).toEqual({ number: 2 })
  })

  it('numbers each campaign independently', async () => {
    const first = await createCampaign('First')
    const second = await createCampaign('Second')
    await createSession(first, { title: 'A' })
    await createSession(first, { title: 'B' })

    const response = await request(app).get(`/api/v1/campaigns/${second}/sessions/next-number`)

    expect(response.body.data).toEqual({ number: 1 })
  })

  it('returns 404 for an unknown campaign', async () => {
    const response = await request(app).get(
      '/api/v1/campaigns/does-not-exist/sessions/next-number',
    )

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('POST /api/v1/campaigns/:campaignId/sessions', () => {
  it('creates a session with 201, auto number and DRAFT status', async () => {
    const campaignId = await createCampaign()

    const response = await createSession(campaignId, {
      title: '  La cripta  ',
      summary: 'El grupo entra en la cripta.',
      playedAt: '2026-01-01T20:00:00.000Z',
    })

    expect(response.status).toBe(201)
    expect(response.body.data).toMatchObject({
      campaignId,
      number: 1,
      title: 'La cripta',
      summary: 'El grupo entra en la cripta.',
      playedAt: '2026-01-01T20:00:00.000Z',
      status: 'DRAFT',
      notePath: null,
    })
    expect(response.body.data.id).toBeTypeOf('string')
    expect(response.body.data.createdAt).toBeTypeOf('string')
  })

  it('assigns consecutive numbers and ignores any client-supplied number', async () => {
    const campaignId = await createCampaign()

    const first = await createSession(campaignId, { title: 'Primera', number: 99 })
    const second = await createSession(campaignId, { title: 'Segunda', number: 99 })

    expect(first.body.data.number).toBe(1)
    expect(second.body.data.number).toBe(2)
  })

  it('defaults summary, playedAt and notePath to null', async () => {
    const campaignId = await createCampaign()

    const response = await createSession(campaignId, { title: 'La cripta' })

    expect(response.body.data.summary).toBeNull()
    expect(response.body.data.playedAt).toBeNull()
    expect(response.body.data.notePath).toBeNull()
  })

  it('returns 404 for an unknown campaign', async () => {
    const response = await request(app)
      .post('/api/v1/campaigns/does-not-exist/sessions')
      .send({ title: 'La cripta' })

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })

  it('returns 400 for an empty title', async () => {
    const campaignId = await createCampaign()

    const response = await createSession(campaignId, { title: '   ' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('GET /api/v1/sessions/:id', () => {
  it('returns the session by id', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app).get(`/api/v1/sessions/${created.body.data.id}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      id: created.body.data.id,
      campaignId,
      title: 'La cripta',
      status: 'DRAFT',
    })
  })

  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const response = await request(app).get('/api/v1/sessions/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Session not found' })
  })
})

describe('PATCH /api/v1/sessions/:id', () => {
  it('updates editable fields', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .patch(`/api/v1/sessions/${created.body.data.id}`)
      .send({
        title: 'La cripta profunda',
        summary: 'Sesión reescrita.',
        playedAt: '2026-02-02T18:30:00.000Z',
        notePath: '10_Sesiones/Sesion 01.md',
      })

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      title: 'La cripta profunda',
      summary: 'Sesión reescrita.',
      playedAt: '2026-02-02T18:30:00.000Z',
      notePath: '10_Sesiones/Sesion 01.md',
      status: 'DRAFT',
    })
  })

  it('clears nullable fields with explicit null', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, {
      title: 'La cripta',
      summary: 'Resumen',
      playedAt: '2026-02-02T18:30:00.000Z',
    })

    const response = await request(app)
      .patch(`/api/v1/sessions/${created.body.data.id}`)
      .send({ summary: null, playedAt: null })

    expect(response.status).toBe(200)
    expect(response.body.data.summary).toBeNull()
    expect(response.body.data.playedAt).toBeNull()
  })

  it('returns 400 for an empty PATCH body', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .patch(`/api/v1/sessions/${created.body.data.id}`)
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 400 when trying to patch status directly', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .patch(`/api/v1/sessions/${created.body.data.id}`)
      .send({ status: 'PLAYED' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 404 for an unknown id', async () => {
    const response = await request(app)
      .patch('/api/v1/sessions/does-not-exist')
      .send({ title: 'Nueva' })

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('POST /api/v1/sessions/:id/transition', () => {
  it('moves DRAFT -> PLAYED and stamps playedAt when it was empty', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'PLAYED' })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('PLAYED')
    expect(response.body.data.playedAt).toBeTypeOf('string')
  })

  it('keeps an explicit playedAt when transitioning to PLAYED', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, {
      title: 'La cripta',
      playedAt: '2026-03-03T19:00:00.000Z',
    })

    const response = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'PLAYED' })

    expect(response.body.data.playedAt).toBe('2026-03-03T19:00:00.000Z')
  })

  it('moves PLAYED -> CLOSED', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })
    await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'PLAYED' })

    const response = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'CLOSED' })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('CLOSED')
  })

  it('returns 409 INVALID_TRANSITION for a skipped state (DRAFT -> CLOSED)', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'CLOSED' })

    expect(response.status).toBe(409)
    expect(response.body.error).toMatchObject({
      code: 'INVALID_TRANSITION',
      details: { from: 'DRAFT', to: 'CLOSED' },
    })
  })

  it('returns 409 INVALID_TRANSITION for a backwards move and a no-op', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })
    await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'PLAYED' })
    await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'CLOSED' })

    const backwards = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'PLAYED' })
    const noop = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'CLOSED' })

    expect(backwards.status).toBe(409)
    expect(backwards.body.error).toMatchObject({ code: 'INVALID_TRANSITION' })
    expect(noop.status).toBe(409)
    expect(noop.body.error).toMatchObject({ code: 'INVALID_TRANSITION' })
  })

  it('returns 400 for an unknown target status', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const response = await request(app)
      .post(`/api/v1/sessions/${created.body.data.id}/transition`)
      .send({ status: 'CANCELLED' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 404 for an unknown session', async () => {
    const response = await request(app)
      .post('/api/v1/sessions/does-not-exist/transition')
      .send({ status: 'PLAYED' })

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('DELETE /api/v1/sessions/:id', () => {
  it('deletes a session and subsequent get returns 404', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })
    const id: string = created.body.data.id

    const response = await request(app).delete(`/api/v1/sessions/${id}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({ id })

    const fetched = await request(app).get(`/api/v1/sessions/${id}`)
    expect(fetched.status).toBe(404)
  })

  it('does not reuse the number of a deleted session', async () => {
    const campaignId = await createCampaign()
    const first = await createSession(campaignId, { title: 'Primera' })
    await createSession(campaignId, { title: 'Segunda' })
    await request(app).delete(`/api/v1/sessions/${first.body.data.id}`)

    const third = await createSession(campaignId, { title: 'Tercera' })

    expect(third.body.data.number).toBe(3)
  })

  it('returns 404 for an unknown id', async () => {
    const response = await request(app).delete('/api/v1/sessions/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('campaign cascade', () => {
  it('deleting a campaign removes its sessions', async () => {
    const campaignId = await createCampaign()
    const created = await createSession(campaignId, { title: 'La cripta' })

    const deleted = await request(app).delete(`/api/v1/campaigns/${campaignId}`)
    expect(deleted.status).toBe(200)

    const fetched = await request(app).get(`/api/v1/sessions/${created.body.data.id}`)
    expect(fetched.status).toBe(404)
  })
})
