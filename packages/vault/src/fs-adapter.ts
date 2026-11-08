import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseNoteContent, serializeNote } from './frontmatter'
import type { VaultAdapter, VaultAdapterOptions, VaultNote, VaultNoteRef } from './types'

const DEFAULT_IGNORED = ['.obsidian', '.trash', 'node_modules']

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/')
}

function assertMarkdownPath(relativePath: string): void {
  if (!relativePath.toLowerCase().endsWith('.md')) {
    throw new Error(`Vault notes must be markdown files: ${relativePath}`)
  }
}

export class FsVaultAdapter implements VaultAdapter {
  readonly root: string
  private readonly ignored: ReadonlySet<string>

  constructor(options: VaultAdapterOptions) {
    this.root = path.resolve(options.root)
    this.ignored = new Set(options.ignore ?? DEFAULT_IGNORED)
  }

  private resolveInside(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      throw new Error('Vault paths must be relative')
    }

    const resolved = path.resolve(this.root, relativePath)
    const rootWithSeparator = this.root.endsWith(path.sep) ? this.root : `${this.root}${path.sep}`
    if (resolved !== this.root && !resolved.startsWith(rootWithSeparator)) {
      throw new Error(`Vault path escapes the vault root: ${relativePath}`)
    }

    return resolved
  }

  async listNotes(): Promise<VaultNoteRef[]> {
    const notes: VaultNoteRef[] = []

    const walk = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true })
      for (const entry of entries) {
        if (this.ignored.has(entry.name)) {
          continue
        }

        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
          await walk(fullPath)
          continue
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          notes.push({
            path: toPosix(path.relative(this.root, fullPath)),
            title: entry.name.slice(0, -3),
          })
        }
      }
    }

    await walk(this.root)
    return notes.sort((a, b) => a.path.localeCompare(b.path))
  }

  async readNote(relativePath: string): Promise<VaultNote> {
    assertMarkdownPath(relativePath)
    const absolutePath = this.resolveInside(relativePath)
    const content = await readFile(absolutePath, 'utf8')
    const parsed = parseNoteContent(content)

    return {
      path: toPosix(path.relative(this.root, absolutePath)),
      frontmatter: parsed.frontmatter,
      body: parsed.body,
    }
  }

  async writeNote(note: VaultNote): Promise<void> {
    assertMarkdownPath(note.path)
    const absolutePath = this.resolveInside(note.path)
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, serializeNote(note), 'utf8')
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const absolutePath = this.resolveInside(relativePath)
      return (await stat(absolutePath)).isFile()
    } catch {
      return false
    }
  }
}

export function createFsVaultAdapter(options: VaultAdapterOptions): FsVaultAdapter {
  return new FsVaultAdapter(options)
}
