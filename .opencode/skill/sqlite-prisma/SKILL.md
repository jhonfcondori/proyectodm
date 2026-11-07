---
name: sqlite-prisma
description: Use before any Prisma schema change, migration, db push, seed, FTS5 table or database restore in ProyectoDM.
---

# SQLite + Prisma

## Mandatory

1. `npm run db:backup -- --label <label>` before any schema, migration, seed or bulk import.
2. Record the backup path and checksum in `docs/revert/PR-<number>.md`.

## Migrations

- Prisma + SQLite. `DATABASE_URL="file:./dev.db"`.
- Applied migrations are immutable; add a new migration.
- SQLite has no automatic down migrations: rollback is restore-from-backup.
- Destructive changes use expand/contract across separate PRs.
- FTS5 virtual tables use a manual SQL migration; Prisma cannot model them.

## Restore

```bash
npm run db:restore -- --file <backup.db> --yes
npx prisma migrate resolve --rolled-back <migration>
npx prisma migrate deploy
```

Stop the API before restoring. The script saves the current database first.

## Review checklist

- [ ] Backup created.
- [ ] Migration is additive or expand/contract.
- [ ] Revert document updated.
- [ ] Tests use a temporary database, never the real one.
