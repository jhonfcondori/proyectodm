import { describe, expect, it } from 'vitest'
import {
  diffSessionInput,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '../src/modules/sessions/form'

describe('toDateTimeLocalValue', () => {
  it('renders an ISO datetime as the local datetime-local value', () => {
    const local = new Date(2026, 0, 1, 20, 5, 0)
    expect(toDateTimeLocalValue(local.toISOString())).toBe('2026-01-01T20:05')
  })

  it('returns an empty string for null or invalid input', () => {
    expect(toDateTimeLocalValue(null)).toBe('')
    expect(toDateTimeLocalValue('not-a-date')).toBe('')
  })
})

describe('fromDateTimeLocalValue', () => {
  it('converts a datetime-local value to the same local instant in ISO', () => {
    const expected = new Date(2026, 0, 1, 20, 5, 0).toISOString()
    expect(fromDateTimeLocalValue('2026-01-01T20:05')).toBe(expected)
  })

  it('maps empty and invalid input to null', () => {
    expect(fromDateTimeLocalValue('')).toBeNull()
    expect(fromDateTimeLocalValue('   ')).toBeNull()
    expect(fromDateTimeLocalValue('not-a-date')).toBeNull()
  })
})

describe('diffSessionInput', () => {
  const initial = {
    title: 'La cripta',
    summary: 'Resumen',
    playedAt: '2026-01-01T20:00:00.000Z',
  }

  it('returns an empty patch when nothing changed', () => {
    expect(diffSessionInput(initial, { ...initial })).toEqual({})
  })

  it('returns only the changed fields', () => {
    expect(diffSessionInput(initial, { ...initial, title: 'La cripta profunda' })).toEqual({
      title: 'La cripta profunda',
    })
  })

  it('includes explicit nulls when a field is cleared', () => {
    expect(
      diffSessionInput(initial, { title: initial.title, summary: null, playedAt: null }),
    ).toEqual({ summary: null, playedAt: null })
  })
})
