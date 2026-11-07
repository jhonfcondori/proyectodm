# AGENTS.md — ProyectoDM

Instructions for opencode agents working on this repository. Read this file before any task.

## Project

Local-first D&D 5e Dungeon Master assistant. Public repo: `jhonfcondori/proyectodm`.
The real campaign lives in a local Obsidian vault **outside this repository** and must never be committed, quoted in public docs, or uploaded.

## Stack and layout

```
apps/web/                 React 19 + Vite + TypeScript + Tailwind
apps/api/                 Express 5 + TypeScript + Prisma + SQLite
packages/shared/          Zod contracts and shared types
packages/domain/          Pure D&D rules: RNG, dice, CR/XP, loot, generators
packages/vault/           Obsidian adapters, serializers and sync engine
data/demo/                Fictional demo campaign (public, safe)
data/srd/                 SRD data with attribution
docs/                     Architecture, playbooks, briefings, revert docs
scripts/                  Backup, restore, revert-prep, privacy check
.opencode/                Agent team, skills and commands
```

Module rules:

- Backend: `apps/api/src/modules/<module>/{routes,service,repo,schema,index}.ts`.
- Frontend: `apps/web/src/modules/<module>/{api,hooks,components,pages,index}.ts`.
- Cross-module imports only through `index.ts`.
- `packages/domain` has no I/O and no framework imports.
- `packages/vault` exposes a `VaultAdapter` interface; filesystem is the default adapter.
- No AI inside the application. Generators are deterministic and seedable.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:backup -- --label <label>
npm run db:restore -- --file <backup.db> --yes
npm run revert:prep -- --pr <number> --branch <branch>
npm run privacy:check
npm run pr:ready
```

## Golden rules (mandatory)

1. **Branch from the latest `dev`.** Never commit directly to `dev` or `main`.
   ```bash
   git fetch origin
   git switch dev
   git pull --ff-only origin dev
   git switch -c feat/f<phase>-<slug>
   ```
2. **Back up the database before any database or Prisma change.**
   ```bash
   npm run db:backup -- --label <short-label>
   ```
   Required before `prisma migrate dev`, `prisma db push`, schema edits, seeds, FTS5 migrations or bulk imports.
3. **Prepare the revert before finishing a PR.** Run `npm run revert:prep` and commit `docs/revert/PR-<number>.md`. It must include the pre-migration backup path, migrations applied, `git revert` instructions and post-revert verification.

Database rollback for SQLite/Prisma is restore-from-backup. Destructive schema changes must use expand/contract across separate PRs.

## Pull requests

- Base branch is `dev`. Release PRs are `dev` -> `main`.
- Fill `.github/pull_request_template.md` completely.
- CI must pass: lint, typecheck, test, build, privacy check and gitleaks.
- Squash merge. Tag `pre-merge-pr-<number>` on `dev` before merging.
- Never push secrets, `.env`, `*.db`, backups, `DocMaterial/` or `vault/`.

## Language

- UI and user-facing docs: Spanish.
- Code, identifiers, commits and technical docs: English.
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## Agent delegation

`senior` is the primary orchestrator and does not edit code. It launches the specialist subagents through the task tool. If no agent fits, it must request a new team member instead of improvising.

## Definition of Done

- [ ] Branch created from latest `dev`.
- [ ] Tests, lint, typecheck and build pass.
- [ ] Database backup created if `prisma/**` or data changed.
- [ ] `docs/revert/PR-<number>.md` complete if the database changed.
- [ ] No campaign data, secrets or personal paths.
- [ ] `PENDIENTES.md` updated.
