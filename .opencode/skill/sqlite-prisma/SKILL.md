---
name: sqlite-prisma
description: Use before any Prisma schema change, migration, db push, seed, FTS5 table or database restore in ProyectoDM.
---

# SQLite + Prisma

## Mandatory

1. `npm run db:backup -- --label <label>` before any schema, migration, seed or bulk import.
2. Record the backup path and checksum in `docs/revert/PR-<number>.md`.

## Migrations

- Prisma 7 + SQLite with the `better-sqlite3` driver adapter.
- Schema: `apps/api/prisma/schema.prisma`. Database: `apps/api/prisma/dev.db`.
- `DATABASE_URL="file:./apps/api/prisma/dev.db"` (resolved from the repo root).
- Prisma 7 config lives in `prisma.config.ts`; env vars are loaded explicitly.
- Generated client: `apps/api/src/generated/prisma` (ignored by git; run `npm run db:generate`).
- Applied migrations are immutable; add a new migration.
- SQLite has no automatic down migrations: rollback is restore-from-backup.
- Destructive changes use expand/contract across separate PRs.
- FTS5 virtual tables use a manual SQL migration; Prisma cannot model them.

## Restore

```bash
npm run db:restore -- --file <backup.db> --yes
npm run db:deploy
npm run db:generate
```

Stop the API before restoring. The script saves the current database first.

## Review checklist

- [ ] Backup created.
- [ ] Migration is additive or expand/contract.
- [ ] Revert document updated.
- [ ] Tests use a temporary database, never the real one.
