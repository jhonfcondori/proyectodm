import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { VaultNote } from './types'

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

export interface ParsedNoteContent {
  frontmatter: Record<string, unknown>
  body: string
}

export function parseNoteContent(content: string): ParsedNoteContent {
  const match = FRONTMATTER_PATTERN.exec(content)
  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const parsed: unknown = parseYaml(match[1] ?? '')
  if (parsed !== null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error('Vault frontmatter must be a YAML object')
  }

  const body = content.slice(match[0].length)

  return {
    frontmatter: (parsed ?? {}) as Record<string, unknown>,
    body: body.startsWith('\r\n') ? body.slice(2) : body.startsWith('\n') ? body.slice(1) : body,
  }
}

export function serializeNote(note: VaultNote): string {
  const yaml = stringifyYaml(note.frontmatter).trimEnd()
  if (!yaml) {
    return note.body
  }

  const body = note.body.startsWith('\n') ? note.body.slice(1) : note.body
  return `---\n${yaml}\n---\n\n${body}`
}
