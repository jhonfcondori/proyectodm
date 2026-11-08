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

async function createCampaign(name: string, description?: string): Promise<request.Response> {
  return request(app).post('/api/v1/campaigns').send(
    description === undefined ? { name } : { name, description },
  )
}

describe('GET /api/v1/campaigns', () => {
  it('returns an empty list with correct meta', async () => {
    const response = await request(app).get('/api/v1/campaigns')

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
    expect(response.body.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 })
  })

  it('supports pagination with page=2 and limit=1', async () => {
    const first = await createCampaign('Campaign Alpha')
    const second = await createCampaign('Campaign Beta')
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)

    const response = await request(app).get('/api/v1/campaigns?page=2&limit=1')

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 })
  })

  it('filters by status', async () => {
    const active = await createCampaign('Active Campaign')
    expect(active.status).toBe(201)

    await request(app)
      .patch(`/api/v1/campaigns/${active.body.data.id}`)
      .send({ status: 'ARCHIVED' })

    const activeList = await request(app).get('/api/v1/campaigns?status=ACTIVE')
    expect(activeList.status).toBe(200)
    expect(activeList.body.data).toHaveLength(0)

    const archivedList = await request(app).get('/api/v1/campaigns?status=ARCHIVED')
    expect(archivedList.status).toBe(200)
    expect(archivedList.body.data).toHaveLength(1)
    expect(archivedList.body.data[0].name).toBe('Active Campaign')
  })

  it('filters by q matching the campaign name', async () => {
    await createCampaign('Dragon Heist')
    await createCampaign('Curse of Strahd')

    const response = await request(app).get('/api/v1/campaigns?q=dragon')

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].name).toBe('Dragon Heist')
  })

  it('trims q before matching (q with surrounding spaces)', async () => {
    await createCampaign('El Anillo Perdido')
    await createCampaign('Curse of Strahd')

    const response = await request(app).get(`/api/v1/campaigns?q=${encodeURIComponent('  anillo  ')}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].name).toBe('El Anillo Perdido')
  })

  it('ignores a whitespace-only q', async () => {
    await createCampaign('Dragon Heist')
    await createCampaign('Curse of Strahd')

    const response = await request(app).get(`/api/v1/campaigns?q=${encodeURIComponent('   ')}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
  })

  it('returns an empty page beyond the end with correct meta (page=3, limit=1, 2 rows)', async () => {
    await createCampaign('Campaign Alpha')
    await createCampaign('Campaign Beta')

    const response = await request(app).get('/api/v1/campaigns?page=3&limit=1')

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
    expect(response.body.meta).toEqual({ page: 3, limit: 1, total: 2, totalPages: 2 })
  })

  // Decision: limit=0 is rejected with 400 by PageQuerySchema (min 1),
  // it is NOT normalised to a default. Documented here so the contract is explicit.
  it('returns 400 VALIDATION_ERROR for limit=0', async () => {
    const response = await request(app).get('/api/v1/campaigns?limit=0')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  // Decision: page=abc coerces to NaN and fails Zod number validation with
  // 400; it does NOT fall back to the default page=1.
  it('returns 400 VALIDATION_ERROR for page=abc', async () => {
    const response = await request(app).get('/api/v1/campaigns?page=abc')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 400 VALIDATION_ERROR (no crash) for repeated status param (?status=ACTIVE&status=ARCHIVED)', async () => {
    const response = await request(app).get('/api/v1/campaigns?status=ACTIVE&status=ARCHIVED')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('POST /api/v1/campaigns', () => {
  it('creates a campaign with 201 and defaults status to ACTIVE', async () => {
    const response = await createCampaign('Dragon Heist', 'A short description')

    expect(response.status).toBe(201)
    expect(response.body.data.name).toBe('Dragon Heist')
    expect(response.body.data.description).toBe('A short description')
    expect(response.body.data.status).toBe('ACTIVE')
    expect(response.body.data.id).toBeTypeOf('string')
    expect(response.body.data.createdAt).toBeTypeOf('string')
    expect(response.body.data.updatedAt).toBeTypeOf('string')
  })

  // Name uniqueness is application-level (service existsByName -> 409), not a
  // DB unique constraint: after removing @@unique([name]), the second create
  // must still be 409 because the service rejects it, not because Prisma
  // throws P2002.
  it('returns 409 CONFLICT for a duplicate name (service-level, not DB constraint)', async () => {
    const first = await createCampaign('Dragon Heist')
    expect(first.status).toBe(201)

    const response = await createCampaign('Dragon Heist')

    expect(response.status).toBe(409)
    expect(response.body.error).toMatchObject({ code: 'CONFLICT' })
  })

  it('returns 400 VALIDATION_ERROR for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/v1/campaigns')
      .set('Content-Type', 'application/json')
      .send('{bad json')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 400 VALIDATION_ERROR for an empty name', async () => {
    const response = await request(app).post('/api/v1/campaigns').send({ name: '' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('returns 400 VALIDATION_ERROR for a description longer than 4000 characters', async () => {
    const response = await request(app)
      .post('/api/v1/campaigns')
      .send({ name: 'Dragon Heist', description: 'x'.repeat(4001) })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('GET /api/v1/campaigns/:id', () => {
  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const response = await request(app).get('/api/v1/campaigns/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })

  it('returns detail with session and entity counts', async () => {
    const created = await createCampaign('Dragon Heist')
    expect(created.status).toBe(201)
    const id: string = created.body.data.id

    await testDb.prisma.session.create({
      data: { campaignId: id, number: 1, title: 'Session One' },
    })
    await testDb.prisma.entity.create({
      data: { campaignId: id, type: 'NPC', name: 'Mirt the Moneylender' },
    })

    const response = await request(app).get(`/api/v1/campaigns/${id}`)

    expect(response.status).toBe(200)
    expect(response.body.data.id).toBe(id)
    expect(response.body.data.sessionCount).toBe(1)
    expect(response.body.data.entityCount).toBe(1)
  })
})

describe('PATCH /api/v1/campaigns/:id', () => {
  it('updates a campaign with 200', async () => {
    const created = await createCampaign('Dragon Heist')
    const id: string = created.body.data.id

    const response = await request(app)
      .patch(`/api/v1/campaigns/${id}`)
      .send({ name: 'Waterdeep Heist', status: 'ARCHIVED' })

    expect(response.status).toBe(200)
    expect(response.body.data.name).toBe('Waterdeep Heist')
    expect(response.body.data.status).toBe('ARCHIVED')

    const fetched = await request(app).get(`/api/v1/campaigns/${id}`)
    expect(fetched.body.data.name).toBe('Waterdeep Heist')
  })

  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const response = await request(app)
      .patch('/api/v1/campaigns/does-not-exist')
      .send({ name: 'New name' })

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })

  it('returns 409 CONFLICT when patching to the name of ANOTHER campaign', async () => {
    const first = await createCampaign('Dragon Heist')
    const second = await createCampaign('Curse of Strahd')
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)

    const response = await request(app)
      .patch(`/api/v1/campaigns/${second.body.data.id}`)
      .send({ name: 'Dragon Heist' })

    expect(response.status).toBe(409)
    expect(response.body.error).toMatchObject({ code: 'CONFLICT' })
  })

  it('returns 200 when patching a campaign with its OWN name (no false 409)', async () => {
    const created = await createCampaign('Dragon Heist')
    expect(created.status).toBe(201)
    const id: string = created.body.data.id

    const response = await request(app)
      .patch(`/api/v1/campaigns/${id}`)
      .send({ name: 'Dragon Heist' })

    expect(response.status).toBe(200)
    expect(response.body.data.name).toBe('Dragon Heist')
  })

  it('returns 400 VALIDATION_ERROR for an empty PATCH body ({})', async () => {
    const created = await createCampaign('Dragon Heist')
    const id: string = created.body.data.id

    const response = await request(app).patch(`/api/v1/campaigns/${id}`).send({})

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('DELETE /api/v1/campaigns/:id', () => {
  it('deletes a campaign with 200 and subsequent get returns 404', async () => {
    const created = await createCampaign('Dragon Heist')
    const id: string = created.body.data.id

    const response = await request(app).delete(`/api/v1/campaigns/${id}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({ id })

    const fetched = await request(app).get(`/api/v1/campaigns/${id}`)
    expect(fetched.status).toBe(404)
  })

  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const response = await request(app).delete('/api/v1/campaigns/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})
