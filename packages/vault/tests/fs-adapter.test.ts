import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFsVaultAdapter } from '../src/index'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'proyectodm-test-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('FsVaultAdapter', () => {
  it('writes and reads a note with frontmatter', async () => {
    const vault = createFsVaultAdapter({ root })
    await vault.writeNote({
      path: '00_Hub/Inicio.md',
      frontmatter: { title: 'Inicio', tags: ['hub'] },
      body: '# Inicio\n',
    })

    const note = await vault.readNote('00_Hub/Inicio.md')
    expect(note.frontmatter.title).toBe('Inicio')
    expect(note.body).toBe('# Inicio\n')
    expect(await vault.exists('00_Hub/Inicio.md')).toBe(true)
  })

  it('lists markdown notes and ignores Obsidian metadata', async () => {
    await mkdir(path.join(root, '.obsidian'), { recursive: true })
    await writeFile(path.join(root, '.obsidian', 'workspace.json'), '{}', 'utf8')
    await writeFile(path.join(root, 'Inicio.md'), '# Inicio\n', 'utf8')
    await mkdir(path.join(root, '02_Sesiones'))
    await writeFile(path.join(root, '02_Sesiones', 'Sesion 1.md'), '# Sesion\n', 'utf8')
    await writeFile(path.join(root, 'nota.txt'), 'ignore me', 'utf8')

    const vault = createFsVaultAdapter({ root })
    const notes = await vault.listNotes()

    expect(notes).toEqual([
      { path: '02_Sesiones/Sesion 1.md', title: 'Sesion 1' },
      { path: 'Inicio.md', title: 'Inicio' },
    ])
  })

  it('rejects paths that escape the vault root', async () => {
    const vault = createFsVaultAdapter({ root })

    await expect(vault.readNote('../outside.md')).rejects.toThrow()
    await expect(vault.writeNote({ path: '../outside.md', frontmatter: {}, body: '' })).rejects.toThrow()
  })

  it('rejects non-markdown paths', async () => {
    const vault = createFsVaultAdapter({ root })
    await expect(vault.readNote('image.png')).rejects.toThrow()
  })
})
