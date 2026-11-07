---
description: Create and apply a Prisma/SQLite migration safely, with backup and revert document.
agent: backend
---

Migration: $ARGUMENTS

1. Stop the API.
2. Run `npm run db:backup -- --label $ARGUMENTS`.
3. Edit `prisma/schema.prisma`. Never edit an applied migration.
4. Run `npx prisma migrate dev --name <name>`.
5. If FTS5 is involved, add a manual SQL migration.
6. Run `npx prisma generate` and the tests.
7. Run `npm run revert:prep -- --pr <number> --branch <branch> --backup <backup> --migrations <names>`.
8. Report backup path, migration names and revert document.
