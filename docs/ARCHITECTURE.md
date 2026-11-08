# Architecture

## Goals

- Local-first: the DM runs one command and everything works offline.
- Modular: each feature is an isolated backend + frontend module with an explicit public API.
- Obsidian-friendly: markdown + YAML frontmatter + wikilinks, no community plugin required.
- Deterministic: generators use a seedable RNG; there is no AI inside the app.
- Safe to evolve: database changes are backed up and reversible.

## Monorepo

```
apps/web/                 React + Vite + TypeScript + Tailwind
apps/api/                 Express + TypeScript + Prisma + SQLite
packages/shared/          Zod contracts and shared types
packages/domain/          Pure D&D rules (no I/O, no framework imports)
packages/vault/           Obsidian adapters, serializers, sync engine
data/demo/                Fictional demo campaign (public)
data/srd/                 SRD data with attribution
docs/                     Architecture, playbooks, briefings, revert docs
scripts/                  db backup/restore, revert prep, privacy check
```

## Module boundaries

Backend module:

```
apps/api/src/modules/<module>/
  <module>.routes.ts
  <module>.service.ts
  <module>.repo.ts
  <module>.schema.ts
  index.ts
```

Frontend module:

```
apps/web/src/modules/<module>/
  api.ts
  hooks.ts
  components/
  pages/
  index.ts
```

Rules enforced by lint (dependency-cruiser):

- A module can only import another module through its `index.ts`.
- `apps/web` may import `packages/shared` and `packages/domain`.
- `apps/api` may import `packages/shared`, `packages/domain` and `packages/vault`.
- `packages/domain` imports no app or framework code.
- `packages/vault` exposes `VaultAdapter`; the filesystem adapter is the default.

## Data ownership

| Data | Source of truth |
| --- | --- |
| Narrative notes, sessions, wiki | Obsidian vault (markdown) |
| Structured state: combat, dice history, loot inventory | SQLite |
| Search index | SQLite FTS5 (rebuilt from both) |

The database mirrors vault content for search and structured state, but never silently overwrites a newer vault file. Conflicts create a `.conflict-<date>.md` copy.

## Database

- Prisma 7 + SQLite with the `better-sqlite3` driver adapter.
- `DATABASE_URL="file:./apps/api/prisma/dev.db"`; paths are resolved from the repository root.
- Schema: `apps/api/prisma/schema.prisma`; config: `prisma.config.ts`.
- Generated client: `apps/api/src/generated/prisma` (ignored by git).
- FTS5 virtual tables are created with manual SQL migrations because Prisma does not model virtual tables.
- Every schema change requires a backup before `npm run db:migrate`.
- SQLite rollback is restore-from-backup. Prisma migrations are forward-only.
- Destructive changes use expand/contract across separate PRs.

## Obsidian integration

`packages/vault` defines:

```ts
interface VaultAdapter {
  readonly root: string;
  listNotes(): Promise<VaultNoteRef[]>;
  readNote(path: string): Promise<VaultNote>;
  writeNote(note: VaultNote): Promise<void>;
  exists(path: string): Promise<boolean>;
}
```

Adapters:

1. `FsVaultAdapter` — default, no plugin needed.
2. `LocalRestApiVaultAdapter` — optional, requires the Obsidian Local REST API community plugin.
3. A custom Obsidian plugin bridge — future work.
4. `watch(onChange)` will be added with the bidirectional sync engine in Phase 6.

Frontmatter on exported notes includes a stable `dm_id`, `dm_type`, `campaign` and `updated_at`.

## API

- Base path: `/api/v1`.
- Validation with Zod contracts from `packages/shared`.
- Response envelope: `{ data, meta }` or `{ error: { code, message, details } }`.
- `GET /health` is the exception: it returns the shared `HealthResponse` directly so monitoring can read it without unwrapping.
- Pagination: `?page=&limit=`.
- Error codes: 400, 404, 409, 422.

## Security and privacy

- The server binds to `127.0.0.1`.
- Public repository: no campaign data, no real vault path, no secrets.
- `.env` is ignored; `.env.example` is committed.
- CI runs `gitleaks` and `privacy:check` on every push and PR.
