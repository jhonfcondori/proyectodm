import { type Rng } from './rng'

export interface DiceRollSpec {
  count: number
  sides: number
  modifier: number
}

export interface DiceRollResult extends DiceRollSpec {
  notation: string
  rolls: number[]
  total: number
}

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage'

export interface D20RollResult {
  mode: AdvantageMode
  rolls: number[]
  total: number
}

const DICE_PATTERN = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/i

export function parseDiceNotation(notation: string): DiceRollSpec {
  const match = DICE_PATTERN.exec(notation)
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }

  const count = match[1] ? Number.parseInt(match[1], 10) : 1
  const sides = Number.parseInt(match[2] as string, 10)
  const modifierText = match[3]?.replace(/\s+/g, '') ?? ''
  const modifier = modifierText ? Number.parseInt(modifierText, 10) : 0

  if (count < 1 || count > 100) {
    throw new Error('Dice count must be between 1 and 100')
  }
  if (sides < 2 || sides > 1000) {
    throw new Error('Dice sides must be between 2 and 1000')
  }
  if (Math.abs(modifier) > 1000) {
    throw new Error('Dice modifier must be between -1000 and 1000')
  }

  return { count, sides, modifier }
}

export function rollDice(notation: string, rng: Rng): DiceRollResult {
  const spec = parseDiceNotation(notation)
  const rolls = Array.from({ length: spec.count }, () => rng.int(1, spec.sides))
  const total = rolls.reduce((sum, roll) => sum + roll, spec.modifier)

  return { ...spec, notation, rolls, total }
}

export function rollD20(
  rng: Rng,
  mode: AdvantageMode = 'normal',
): D20RollResult {
  const first = rng.int(1, 20)

  if (mode === 'normal') {
    return { mode, rolls: [first], total: first }
  }

  const second = rng.int(1, 20)
  const total = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second)
  return { mode, rolls: [first, second], total }
}
