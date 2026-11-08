export interface Rng {
  next(): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
}

function xmur3(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed: string | number): Rng {
  const hash = xmur3(String(seed))
  const random = mulberry32(hash())

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error('Rng.int expects integer bounds')
    }
    if (max < min) {
      throw new Error('Rng.int expects max >= min')
    }
    return Math.floor(random() * (max - min + 1)) + min
  }

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('Rng.pick expects at least one item')
    }
    return items[int(0, items.length - 1)] as T
  }

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = int(0, i)
      const current = result[i] as T
      result[i] = result[j] as T
      result[j] = current
    }
    return result
  }

  return { next: random, int, pick, shuffle }
}
