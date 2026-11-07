# Revert playbook

Three mandatory rules govern every change. This document explains how to satisfy them.

## 1. New branch from the latest `dev`

```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/f<phase>-<slug>
```

Never commit directly to `dev` or `main`. Before merging, tag the current `dev`:

```bash
git tag pre-merge-pr-<number> dev
git push origin pre-merge-pr-<number>
```

## 2. Back up the database before touching it

Required before `prisma migrate dev`, `prisma db push`, schema edits, seeds, FTS5 migrations or bulk imports.

```bash
npm run db:backup -- --label <short-label>
```

The script writes `backups/db/proyectodm-<timestamp>-<label>.db` plus a `.sha256` file. Keep it for at least 14 days. For extra safety, copy it to your local vault backup folder, outside the repository.

Restore:

```bash
npm run db:restore -- --file backups/db/proyectodm-<timestamp>-<label>.db --yes
```

The restore script first saves the current database as `proyectodm-pre-restore-<timestamp>.db`, then replaces it. Stop the API before restoring.

## 3. Prepare the revert before finishing a PR

```bash
npm run revert:prep -- --pr <number> --branch <branch> --backup backups/db/<file>.db
```

This creates `docs/revert/PR-<number>.md` from `docs/revert/TEMPLATE.md`, including:

- The `dev` SHA before the merge (or the `pre-merge-pr-<number>` tag).
- The feature branch head SHA.
- The database backup path and checksum.
- The migrations applied.
- Exact code and database revert commands.
- Post-revert verification steps.

CI rejects a PR that changes `prisma/**` without its revert document.

## Reverting code and database

```bash
git switch dev
git revert -m 1 <merge_commit_sha>
git push origin dev
```

Then restore the database:

```bash
npm run db:restore -- --file <pre-migration-backup> --yes
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate deploy
npm run test
npm run build
```

If the merge was not pushed yet, `git reset --hard pre-merge-pr-<number>` is faster.

## Prisma specifics

- Prisma has no automatic down migrations for SQLite.
- The reliable rollback is restore-from-backup.
- Document a down SQL file only when it is safe and data-preserving.
- Never edit an applied migration. Create a new one.
- Destructive changes: expand in one PR, migrate data, contract in a later PR.

## Post-revert verification

- [ ] `GET /api/v1/health` returns 200.
- [ ] `npm run test` and `npm run build` pass.
- [ ] The affected feature is manually checked.
- [ ] The restored database opens and has the expected row counts.
- [ ] `docs/revert/PR-<number>.md` is updated with the revert outcome.
