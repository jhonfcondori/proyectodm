import { describe, expect, it } from 'vitest'
import { parseNoteContent, serializeNote } from '../src/index'

describe('frontmatter', () => {
  it('parses YAML frontmatter and body', () => {
    const content = '---\ntitle: Inicio\ntags:\n  - hub\n---\n\n# Inicio\n'
    const parsed = parseNoteContent(content)

    expect(parsed.frontmatter).toEqual({ title: 'Inicio', tags: ['hub'] })
    expect(parsed.body).toBe('# Inicio\n')
  })

  it('returns the whole document as body when frontmatter is absent', () => {
    expect(parseNoteContent('# Nota\n')).toEqual({ frontmatter: {}, body: '# Nota\n' })
  })

  it('round-trips a note', () => {
    const serialized = serializeNote({
      path: '00_Hub/Inicio.md',
      frontmatter: { title: 'Inicio', tags: ['hub'] },
      body: '# Inicio\n',
    })
    const parsed = parseNoteContent(serialized)

    expect(parsed.frontmatter).toEqual({ title: 'Inicio', tags: ['hub'] })
    expect(parsed.body).toBe('# Inicio\n')
  })

  it('rejects non-object frontmatter', () => {
    expect(() => parseNoteContent('---\n- one\n- two\n---\nBody\n')).toThrow()
  })
})
