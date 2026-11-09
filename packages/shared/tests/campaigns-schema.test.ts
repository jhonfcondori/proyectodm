import { describe, expect, it } from 'vitest'
import {
  ApiErrorCodeSchema,
  CampaignCreateSchema,
  CampaignListQuerySchema,
  CampaignStatusSchema,
  CampaignUpdateSchema,
  IdParamSchema,
  PageQuerySchema,
} from '../src/index'

describe('ApiErrorCodeSchema', () => {
  it('accepts known codes and rejects unknown ones', () => {
    expect(ApiErrorCodeSchema.safeParse('VALIDATION_ERROR').success).toBe(true)
    expect(ApiErrorCodeSchema.safeParse('CONFLICT').success).toBe(true)
    expect(ApiErrorCodeSchema.safeParse('UNKNOWN_CODE').success).toBe(false)
  })
})

describe('CampaignStatusSchema', () => {
  it('accepts ACTIVE and ARCHIVED', () => {
    expect(CampaignStatusSchema.safeParse('ACTIVE').success).toBe(true)
    expect(CampaignStatusSchema.safeParse('ARCHIVED').success).toBe(true)
  })

  it('rejects invalid status values', () => {
    expect(CampaignStatusSchema.safeParse('active').success).toBe(false)
    expect(CampaignStatusSchema.safeParse('DELETED').success).toBe(false)
  })
})

describe('CampaignCreateSchema', () => {
  it('accepts a valid campaign', () => {
    const result = CampaignCreateSchema.safeParse({
      name: 'Dragon Heist',
      description: 'A short description',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a campaign without description', () => {
    expect(CampaignCreateSchema.safeParse({ name: 'Dragon Heist' }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(CampaignCreateSchema.safeParse({ name: '' }).success).toBe(false)
    expect(CampaignCreateSchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('rejects a name longer than 120 characters', () => {
    expect(CampaignCreateSchema.safeParse({ name: 'x'.repeat(121) }).success).toBe(false)
  })

  it('rejects a description longer than 4000 characters', () => {
    expect(
      CampaignCreateSchema.safeParse({ name: 'Dragon Heist', description: 'x'.repeat(4001) })
        .success,
    ).toBe(false)
  })

  it('trims surrounding whitespace from the name', () => {
    const result = CampaignCreateSchema.safeParse({ name: '  Dragon Heist  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Dragon Heist')
    }
  })

  // Description is trimmed like the name; a whitespace-only description
  // becomes '' (kept, not coerced to undefined/null), so callers can tell
  // "empty string" apart from "field omitted" (see campaigns.ts comment).
  it('trims surrounding whitespace from the description and keeps empty string', () => {
    const trimmed = CampaignCreateSchema.safeParse({
      name: 'Dragon Heist',
      description: '  A short description  ',
    })
    expect(trimmed.success).toBe(true)
    if (trimmed.success) {
      expect(trimmed.data.description).toBe('A short description')
    }

    const empty = CampaignCreateSchema.safeParse({ name: 'Dragon Heist', description: '   ' })
    expect(empty.success).toBe(true)
    if (empty.success) {
      expect(empty.data.description).toBe('')
    }
  })
})

describe('CampaignUpdateSchema', () => {
  it('accepts a partial update', () => {
    expect(CampaignUpdateSchema.safeParse({ name: 'New name' }).success).toBe(true)
    expect(CampaignUpdateSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(true)
    expect(CampaignUpdateSchema.safeParse({ description: null }).success).toBe(true)
  })

  it('rejects an empty update body', () => {
    expect(CampaignUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an invalid status in an update', () => {
    expect(CampaignUpdateSchema.safeParse({ status: 'DELETED' }).success).toBe(false)
  })
})

describe('CampaignListQuerySchema', () => {
  it('applies page/limit defaults', () => {
    const result = CampaignListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces page/limit from query string values', () => {
    const result = CampaignListQuerySchema.safeParse({ page: '2', limit: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(5)
    }
  })

  it('rejects page below 1 and limit above 100', () => {
    expect(CampaignListQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(CampaignListQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
    expect(CampaignListQuerySchema.safeParse({ limit: '0' }).success).toBe(false)
  })

  it('accepts optional status and q filters', () => {
    const result = CampaignListQuerySchema.safeParse({ status: 'ARCHIVED', q: 'dragon' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('ARCHIVED')
      expect(result.data.q).toBe('dragon')
    }
  })

  it('rejects an invalid status filter and overlong q', () => {
    expect(CampaignListQuerySchema.safeParse({ status: 'DELETED' }).success).toBe(false)
    expect(CampaignListQuerySchema.safeParse({ q: 'x'.repeat(121) }).success).toBe(false)
  })
})

describe('PageQuerySchema', () => {
  it('coerces query string numbers with defaults', () => {
    const result = PageQuerySchema.safeParse({ page: '3', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ page: 3, limit: 10 })
    }
  })
})

describe('IdParamSchema', () => {
  it('accepts a cuid-like id and rejects empty or overlong strings', () => {
    expect(IdParamSchema.safeParse('cm9abc123def456ghi789jkl').success).toBe(true)
    expect(IdParamSchema.safeParse('').success).toBe(false)
    expect(IdParamSchema.safeParse('x'.repeat(65)).success).toBe(false)
  })
})
