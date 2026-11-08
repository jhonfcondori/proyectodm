import { describe, expect, it } from 'vitest'
import { createRng } from '../src/index'

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const first = createRng('campaign-42')
    const second = createRng('campaign-42')

    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    )
  })

  it('produces different sequences for different seeds', () => {
    const first = createRng('campaign-a')
    const second = createRng('campaign-b')

    expect(first.next()).not.toBe(second.next())
  })

  it('keeps integer rolls inside the requested range', () => {
    const rng = createRng('range')

    for (let i = 0; i < 200; i += 1) {
      const value = rng.int(3, 7)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('shuffles without mutating or losing items', () => {
    const rng = createRng('shuffle')
    const original = [1, 2, 3, 4, 5]
    const shuffled = rng.shuffle(original)

    expect(original).toEqual([1, 2, 3, 4, 5])
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original)
  })

  it('rejects empty picks and invalid ranges', () => {
    const rng = createRng('errors')

    expect(() => rng.pick([])).toThrow()
    expect(() => rng.int(5, 4)).toThrow()
  })
})
