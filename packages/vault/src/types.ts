export interface VaultNoteRef {
  path: string
  title: string
}

export interface VaultNote {
  path: string
  frontmatter: Record<string, unknown>
  body: string
}

export interface VaultAdapter {
  readonly root: string
  listNotes(): Promise<VaultNoteRef[]>
  readNote(relativePath: string): Promise<VaultNote>
  writeNote(note: VaultNote): Promise<void>
  exists(relativePath: string): Promise<boolean>
}

export interface VaultAdapterOptions {
  root: string
  ignore?: readonly string[]
}
