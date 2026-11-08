import { describe, expect, it } from 'vitest'
import { createRng, parseDiceNotation, rollD20, rollDice } from '../src/index'

describe('parseDiceNotation', () => {
  it('parses count, sides and modifier', () => {
    expect(parseDiceNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 })
    expect(parseDiceNotation('d20')).toEqual({ count: 1, sides: 20, modifier: 0 })
    expect(parseDiceNotation('1d8 - 1')).toEqual({ count: 1, sides: 8, modifier: -1 })
  })

  it('accepts boundary values inside the allowed limits', () => {
    expect(parseDiceNotation('100d1000+1000')).toEqual({ count: 100, sides: 1000, modifier: 1000 })
    expect(parseDiceNotation('1d2-1000')).toEqual({ count: 1, sides: 2, modifier: -1000 })
  })

  it('rejects malformed or out-of-range notation', () => {
    expect(() => parseDiceNotation('d')).toThrow()
    expect(() => parseDiceNotation('0d6')).toThrow()
    expect(() => parseDiceNotation('1d1')).toThrow()
    expect(() => parseDiceNotation('101d6')).toThrow()
    expect(() => parseDiceNotation('1d1001')).toThrow()
    expect(() => parseDiceNotation('1d20+1001')).toThrow()
    expect(() => parseDiceNotation('1d20-1001')).toThrow()
  })
})

describe('rollDice', () => {
  it('returns deterministic rolls for a seed', () => {
    const first = rollDice('3d6+2', createRng('seed'))
    const second = rollDice('3d6+2', createRng('seed'))

    expect(first).toEqual(second)
    expect(first.rolls).toHaveLength(3)
    expect(first.total).toBe(first.rolls.reduce((sum, roll) => sum + roll, 0) + 2)
  })

  it('produces the same sequence of results for two rngs with the same seed', () => {
    const firstRun: number[][] = []
    const secondRun: number[][] = []
    const rngA = createRng('sequence')
    const rngB = createRng('sequence')

    for (let i = 0; i < 2; i += 1) {
      firstRun.push(rollDice('3d6', rngA).rolls)
      secondRun.push(rollDice('3d6', rngB).rolls)
    }

    expect(firstRun).toEqual(secondRun)
  })

  it('keeps every die inside its face range', () => {
    const result = rollDice('10d8', createRng('faces'))
    expect(result.rolls.every((roll) => roll >= 1 && roll <= 8)).toBe(true)
  })
})

describe('rollD20', () => {
  it('uses the highest roll with advantage', () => {
    const result = rollD20(createRng('advantage'), 'advantage')
    expect(result.rolls).toHaveLength(2)
    expect(result.total).toBe(Math.max(...result.rolls))
  })

  it('uses the lowest roll with disadvantage', () => {
    const result = rollD20(createRng('disadvantage'), 'disadvantage')
    expect(result.rolls).toHaveLength(2)
    expect(result.total).toBe(Math.min(...result.rolls))
  })

  it('produces reproducible results in normal mode for the same seed', () => {
    const first = rollD20(createRng('seed-d20'), 'normal')
    const second = rollD20(createRng('seed-d20'), 'normal')

    expect(first).toEqual(second)
    expect(first.rolls).toHaveLength(1)
  })

  it('produces reproducible results in advantage mode for the same seed', () => {
    const first = rollD20(createRng('seed-d20'), 'advantage')
    const second = rollD20(createRng('seed-d20'), 'advantage')

    expect(first).toEqual(second)
    expect(second.rolls).toHaveLength(2)
    expect(second.total).toBe(Math.max(...second.rolls))
  })

  it('produces reproducible results in disadvantage mode for the same seed', () => {
    const first = rollD20(createRng('seed-d20'), 'disadvantage')
    const second = rollD20(createRng('seed-d20'), 'disadvantage')

    expect(first).toEqual(second)
    expect(second.rolls).toHaveLength(2)
    expect(second.total).toBe(Math.min(...second.rolls))
  })
})
