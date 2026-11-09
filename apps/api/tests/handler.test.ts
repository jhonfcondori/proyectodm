import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { HttpError, sendError } from '../src/http/errors'
import { getValidated } from '../src/http/handler'

describe('getValidated', () => {
  it('throws a 500 HttpError when res.locals.validated is undefined (missing validate middleware)', () => {
    const response = { locals: {} } as unknown as Parameters<typeof getValidated>[0]

    let caught: unknown
    try {
      getValidated(response)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(HttpError)
    expect((caught as HttpError).status).toBe(500)
    expect((caught as HttpError).code).toBe('INTERNAL_ERROR')
    expect((caught as HttpError).message).toContain('res.locals.validated is undefined')
  })

  it('returns validated data when present', () => {
    const response = {
      locals: { validated: { body: { name: 'Dragon Heist' } } },
    } as unknown as Parameters<typeof getValidated>[0]

    expect(getValidated<{ name: string }>(response).body).toEqual({ name: 'Dragon Heist' })
  })

  it('surfaces as a 500 through the error middleware when a handler runs without validate', async () => {
    const app = express()
    app.get('/no-validate', (_request, response) => {
      // Deliberately no validate() middleware: getValidated must not return undefined.
      const validated = getValidated(response)
      response.json({ data: validated })
    })
    app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
      sendError(response, error)
    })

    const response = await request(app).get('/no-validate')
    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe('INTERNAL_ERROR')
  })
})
