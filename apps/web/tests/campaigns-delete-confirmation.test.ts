import { describe, expect, it } from 'vitest'
import { isDeleteConfirmationValid } from '../src/modules/campaigns/delete-confirmation'

describe('isDeleteConfirmationValid', () => {
  it('accepts the exact campaign name', () => {
    expect(isDeleteConfirmationValid('Cumbres de Sangre', 'Cumbres de Sangre')).toBe(true)
  })

  it('rejects surrounding spaces on either side, since nothing is trimmed', () => {
    expect(isDeleteConfirmationValid(' Cumbres de Sangre', 'Cumbres de Sangre')).toBe(false)
    expect(isDeleteConfirmationValid('Cumbres de Sangre ', 'Cumbres de Sangre')).toBe(false)
    expect(isDeleteConfirmationValid(' Cumbres de Sangre ', 'Cumbres de Sangre')).toBe(false)
    expect(isDeleteConfirmationValid('Cumbres de Sangre', ' Cumbres de Sangre')).toBe(false)
  })

  it('rejects partial, case-different or reordered names', () => {
    expect(isDeleteConfirmationValid('Cumbres', 'Cumbres de Sangre')).toBe(false)
    expect(isDeleteConfirmationValid('cumbres de sangre', 'Cumbres de Sangre')).toBe(false)
    expect(isDeleteConfirmationValid('Sangre de Cumbres', 'Cumbres de Sangre')).toBe(false)
  })

  it('never confirms against an empty campaign name', () => {
    expect(isDeleteConfirmationValid('', '')).toBe(false)
    expect(isDeleteConfirmationValid('Cumbres de Sangre', '')).toBe(false)
  })

  it('rejects an empty typed value against a real name', () => {
    expect(isDeleteConfirmationValid('', 'Cumbres de Sangre')).toBe(false)
  })
})
