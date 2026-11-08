import { describe, expect, it } from 'vitest'
import { CampaignUpdateSchema } from '@proyectodm/shared'
import { diffCampaignInput, type CampaignFormValues } from '../src/modules/campaigns/form-diff'

const initial: CampaignFormValues = {
  name: 'Cumbres de Sangre',
  description: 'Aventura en las montañas.',
}

describe('diffCampaignInput', () => {
  it('returns an empty body when nothing changed, comparing values and not references', () => {
    const values: CampaignFormValues = {
      name: 'Cumbres de Sangre',
      description: 'Aventura en las montañas.',
    }

    expect(diffCampaignInput(initial, values)).toEqual({})
    expect(diffCampaignInput({ ...initial }, { ...values })).toEqual({})
  })

  it('includes only the changed name', () => {
    const patch = diffCampaignInput(initial, { ...initial, name: 'Cumbres de Ceniza' })

    expect(patch).toEqual({ name: 'Cumbres de Ceniza' })
  })

  it('includes only the changed description', () => {
    const patch = diffCampaignInput(initial, { ...initial, description: 'Otra aventura' })

    expect(patch).toEqual({ description: 'Otra aventura' })
  })

  it('includes both fields when both changed', () => {
    const patch = diffCampaignInput(initial, { name: 'Niebla de Hierro', description: null })

    expect(patch).toEqual({ name: 'Niebla de Hierro', description: null })
  })

  it('normalises an empty description to null', () => {
    expect(diffCampaignInput(initial, { ...initial, description: '' })).toEqual({
      description: null,
    })
    expect(diffCampaignInput({ ...initial, description: null }, { ...initial, description: '   ' })).toEqual({})
  })

  it('reports a description cleared back to null as a change', () => {
    const patch = diffCampaignInput({ name: 'Cumbres de Sangre', description: 'Vieja' }, { name: 'Cumbres de Sangre', description: null })

    expect(patch).toEqual({ description: null })
  })

  it('keeps a name comparison verbatim, spaces included', () => {
    expect(diffCampaignInput(initial, { ...initial, name: 'Cumbres de Sangre ' })).toEqual({
      name: 'Cumbres de Sangre ',
    })
  })

  it('produces a body CampaignUpdateSchema accepts, and an empty diff it rejects', () => {
    expect(CampaignUpdateSchema.safeParse({}).success).toBe(false)

    for (const patch of [
      diffCampaignInput(initial, { ...initial, name: 'Otro nombre' }),
      diffCampaignInput(initial, { ...initial, description: '' }),
      diffCampaignInput(initial, { ...initial, name: 'Otro', description: null }),
    ]) {
      expect(CampaignUpdateSchema.safeParse(patch).success).toBe(true)
    }
  })
})
