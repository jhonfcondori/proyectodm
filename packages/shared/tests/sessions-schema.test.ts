import { describe, expect, it } from 'vitest'
import {
  canTransitionSession,
  NextSessionNumberSchema,
  SESSION_NEXT_STATUS,
  SessionCreateSchema,
  SessionListQuerySchema,
  SessionSchema,
  SessionStatusSchema,
  SessionTransitionSchema,
  SessionUpdateSchema,
} from '../src/index'

describe('SessionStatusSchema', () => {
  it('accepts DRAFT, PLAYED and CLOSED', () => {
    expect(SessionStatusSchema.safeParse('DRAFT').success).toBe(true)
    expect(SessionStatusSchema.safeParse('PLAYED').success).toBe(true)
    expect(SessionStatusSchema.safeParse('CLOSED').success).toBe(true)
  })

  it('rejects lowercase and unknown statuses', () => {
    expect(SessionStatusSchema.safeParse('draft').success).toBe(false)
    expect(SessionStatusSchema.safeParse('CANCELLED').success).toBe(false)
  })
})

describe('session transitions', () => {
  it('defines a forward-only chain', () => {
    expect(SESSION_NEXT_STATUS).toEqual({ DRAFT: 'PLAYED', PLAYED: 'CLOSED', CLOSED: null })
  })

  it('allows exactly the next status', () => {
    expect(canTransitionSession('DRAFT', 'PLAYED')).toBe(true)
    expect(canTransitionSession('PLAYED', 'CLOSED')).toBe(true)
  })

  it('rejects skips, backwards moves and no-ops', () => {
    expect(canTransitionSession('DRAFT', 'CLOSED')).toBe(false)
    expect(canTransitionSession('PLAYED', 'DRAFT')).toBe(false)
    expect(canTransitionSession('CLOSED', 'PLAYED')).toBe(false)
    expect(canTransitionSession('DRAFT', 'DRAFT')).toBe(false)
  })
})

describe('SessionCreateSchema', () => {
  it('accepts a minimal session', () => {
    expect(SessionCreateSchema.safeParse({ title: 'La cripta' }).success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = SessionCreateSchema.safeParse({
      title: 'La cripta',
      summary: 'El grupo entra en la cripta.',
      playedAt: '2026-01-01T20:00:00.000Z',
      notePath: '10_Sesiones/Sesion 01.md',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty or whitespace-only titles and overlong titles', () => {
    expect(SessionCreateSchema.safeParse({ title: '' }).success).toBe(false)
    expect(SessionCreateSchema.safeParse({ title: '   ' }).success).toBe(false)
    expect(SessionCreateSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false)
  })

  it('trims the title and keeps an empty summary as empty string', () => {
    const result = SessionCreateSchema.safeParse({ title: '  La cripta  ', summary: '   ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('La cripta')
      expect(result.data.summary).toBe('')
    }
  })

  it('rejects an overlong summary, an empty note path and a non-ISO playedAt', () => {
    expect(
      SessionCreateSchema.safeParse({ title: 'La cripta', summary: 'x'.repeat(8001) }).success,
    ).toBe(false)
    expect(SessionCreateSchema.safeParse({ title: 'La cripta', notePath: '  ' }).success).toBe(
      false,
    )
    expect(
      SessionCreateSchema.safeParse({ title: 'La cripta', playedAt: '2026-01-01' }).success,
    ).toBe(false)
  })
})

describe('SessionUpdateSchema', () => {
  it('accepts partial updates and explicit nulls to clear fields', () => {
    expect(SessionUpdateSchema.safeParse({ title: 'Nuevo título' }).success).toBe(true)
    expect(SessionUpdateSchema.safeParse({ summary: null }).success).toBe(true)
    expect(SessionUpdateSchema.safeParse({ playedAt: null }).success).toBe(true)
    expect(SessionUpdateSchema.safeParse({ notePath: null }).success).toBe(true)
  })

  it('rejects an empty update body', () => {
    expect(SessionUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('does not accept status: lifecycle changes use the transition endpoint', () => {
    expect(SessionUpdateSchema.safeParse({ status: 'PLAYED' }).success).toBe(false)
  })
})

describe('SessionTransitionSchema', () => {
  it('requires a known target status', () => {
    expect(SessionTransitionSchema.safeParse({ status: 'PLAYED' }).success).toBe(true)
    expect(SessionTransitionSchema.safeParse({ status: 'CANCELLED' }).success).toBe(false)
    expect(SessionTransitionSchema.safeParse({}).success).toBe(false)
  })
})

describe('SessionListQuerySchema', () => {
  it('applies pagination defaults and coerces query strings', () => {
    const result = SessionListQuerySchema.safeParse({ page: '2', limit: '10', status: 'DRAFT' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ page: 2, limit: 10, status: 'DRAFT' })
    }
  })

  it('rejects invalid pagination and status filters', () => {
    expect(SessionListQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(SessionListQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
    expect(SessionListQuerySchema.safeParse({ status: 'CANCELLED' }).success).toBe(false)
  })
})

describe('SessionSchema', () => {
  it('accepts a full session payload', () => {
    const result = SessionSchema.safeParse({
      id: 's1',
      campaignId: 'c1',
      number: 1,
      title: 'La cripta',
      summary: null,
      playedAt: null,
      status: 'DRAFT',
      notePath: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non-positive number', () => {
    const result = SessionSchema.safeParse({
      id: 's1',
      campaignId: 'c1',
      number: 0,
      title: 'La cripta',
      summary: null,
      playedAt: null,
      status: 'DRAFT',
      notePath: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('NextSessionNumberSchema', () => {
  it('requires a positive integer', () => {
    expect(NextSessionNumberSchema.safeParse({ number: 1 }).success).toBe(true)
    expect(NextSessionNumberSchema.safeParse({ number: 0 }).success).toBe(false)
    expect(NextSessionNumberSchema.safeParse({ number: 1.5 }).success).toBe(false)
  })
})
