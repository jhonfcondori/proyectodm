---
name: dnd-5e-domain
description: Use when implementing D&D 5e rules, CR/XP encounter budgets, loot, dice, random tables or seedable generators in packages/domain.
---

# D&D 5e domain

## Principles

- `packages/domain` is pure: no I/O, no database, no framework imports.
- Every random result comes from a seedable RNG passed as a parameter.
- Same seed + same input = same output, always.
- Rules are table-driven and tested with known values.
- No AI inside the application.

## Encounter budget

- Use the 5e thresholds per character level and party size.
- Multipliers by number of monsters; recalculate after adding allies.
- Return `{ adjustedXp, difficulty, thresholds }` so the UI can explain it.

## Loot

- Loot tables are data, not code branches.
- Respect CR tiers and hoard vs individual tables.
- Currency, gems, art objects and magic items are separate entries.

## Dice

- Support `NdM+K`, advantage/disadvantage and deterministic seeds.
- Return individual rolls, dropped dice and total.

## Testing

Use table-driven cases for CR, XP, loot tiers, dice parsing and generator reproducibility with a fixed seed.
