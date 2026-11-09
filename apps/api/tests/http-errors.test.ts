import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { fromPrismaError, HttpError, sendError } from '../src/http/errors'

function buildApp(): express.Express {
  const app = express()
  app.get('/http-400', (_request, response) => {
    sendError(response, new HttpError(400, 'VALIDATION_ERROR', 'Validation failed'))
  })
  app.get('/http-404', (_request, response) => {
    sendError(response, new HttpError(404, 'NOT_FOUND', 'Campaign not found'))
  })
  app.get('/http-409', (_request, response) => {
    sendError(
      response,
      new HttpError(409, 'CONFLICT', 'A campaign with this name already exists'),
    )
  })
  app.get('/http-500', (_request, response) => {
    sendError(response, new Error('SQLITE_ERROR: secret internal path L:\\secret\\dev.db'))
  })
  return app
}

describe('sendError HttpError translation', () => {
  it('returns 400 VALIDATION_ERROR envelope', async () => {
    const response = await request(buildApp()).get('/http-400')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
    })
  })

  it('returns 404 NOT_FOUND envelope', async () => {
    const response = await request(buildApp()).get('/http-404')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    })
  })

  it('returns 409 CONFLICT envelope', async () => {
    const response = await request(buildApp()).get('/http-409')
    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: { code: 'CONFLICT', message: 'A campaign with this name already exists' },
    })
  })

  it('returns 500 without leaking internals for unknown errors', async () => {
    const response = await request(buildApp()).get('/http-500')
    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    })
    expect(JSON.stringify(response.body)).not.toContain('SQLITE_ERROR')
    expect(JSON.stringify(response.body)).not.toContain('secret')
  })

  it('includes details when provided on HttpError', async () => {
    const response = await request(buildApp()).get('/http-400')
    expect(response.body.error.details).toBeUndefined()
  })
})

describe('fromPrismaError', () => {
  it('maps P2002 to a 409 CONFLICT HttpError', () => {
    const mapped = fromPrismaError({ code: 'P2002', message: 'Unique constraint failed' })
    expect(mapped).toBeInstanceOf(HttpError)
    expect((mapped as HttpError).status).toBe(409)
    expect((mapped as HttpError).code).toBe('CONFLICT')
  })

  it('maps P2025 to a 404 NOT_FOUND HttpError', () => {
    const mapped = fromPrismaError({ code: 'P2025', message: 'Record not found' })
    expect(mapped).toBeInstanceOf(HttpError)
    expect((mapped as HttpError).status).toBe(404)
    expect((mapped as HttpError).code).toBe('NOT_FOUND')
  })

  it('passes HttpError and unknown errors through unchanged', () => {
    const http = new HttpError(409, 'CONFLICT', 'already')
    expect(fromPrismaError(http)).toBe(http)
    const unknown = new Error('boom')
    expect(fromPrismaError(unknown)).toBe(unknown)
    expect(fromPrismaError(null)).toBe(null)
    expect(fromPrismaError({ code: 'P9999' })).toEqual({ code: 'P9999' })
  })
})
