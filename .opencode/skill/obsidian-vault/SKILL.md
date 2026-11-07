---
name: obsidian-vault
description: Use when implementing Obsidian vault reading, writing, serialization, frontmatter, wikilinks, file watching, conflict handling or the canonical vault structure.
---

# Obsidian vault

## Adapter

```ts
interface VaultAdapter {
  list(): Promise<VaultFile[]>;
  read(path: string): Promise<VaultFile>;
  write(path: string, content: string): Promise<void>;
  watch(onChange: (path: string) => void): () => void;
}
```

Default: filesystem adapter. Optional: Local REST API plugin. Never hardcode a local path.

## Note format

- YAML frontmatter with `dm_id`, `dm_type`, `campaign`, `updated_at`.
- Body in markdown with `[[wikilinks]]`.
- No community plugins required; no Dataview or Templater queries in exported notes.

## Canonical folders

`00_Hub`, `01_Universo`, `02_Sesiones`, `03_Arcos`, `04_Personajes`, `05_Lugares`, `06_Items`, `07_Vehiculo`, `08_Bestiario`, `09_Mecanicas`, `10_Tablas`, `99_Adjuntos`, `_Archivo`, `_Plantillas`.

## Sync

- Idempotent writes: skip when content is unchanged.
- Detect newer external edits and create `.conflict-<date>.md` instead of overwriting.
- Use stable `dm_id`; do not key on file name.
- Tests use fictional fixture vaults only.
