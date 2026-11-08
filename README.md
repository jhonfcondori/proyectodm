# ProyectoDM

[![CI](https://github.com/jhonfcondori/proyectodm/actions/workflows/ci.yml/badge.svg)](https://github.com/jhonfcondori/proyectodm/actions/workflows/ci.yml)

Local-first web app to help Dungeon Masters run D&D 5e campaigns: campaigns and sessions, campaign wiki, combat tracker, NPC/encounter/loot generators, character sheets, statblocks, dice, rules search, random tables and Obsidian sync.

> Status: **Phase 1 complete** — modular monorepo scaffold, Prisma 7 + SQLite, shared Zod contracts, deterministic domain primitives, vault adapter, API `/api/v1/health` and a React health dashboard. Next: Phase 2 (campaigns, sessions, wiki, search).

## Why

Running a campaign means tracking dozens of open threads: NPCs, debts, clues, pending questions, loot, initiative, conditions and notes spread across many files. ProyectoDM brings those repetitive tasks into one local app, with your Obsidian vault as the narrative source of truth.

- Runs locally (no cloud account required).
- SQLite database, easy to back up by copying one file.
- Markdown + YAML frontmatter + wikilinks: works with a normal Obsidian vault.
- No AI inside the app: generators are deterministic, template-based and seedable.
- Modular monorepo: every feature is an isolated backend + frontend module.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript + Tailwind + TanStack Query |
| Backend | Node 24 + Express 5 + TypeScript + Zod |
| Database | SQLite + Prisma 7 (driver adapter) |
| Search | SQLite FTS5 |
| Tests | Vitest + Supertest (Playwright in Phase 7) |
| Repo | npm workspaces monorepo |

## Planned modules

`campaigns`, `sessions`, `wiki`, `combat`, `generators`, `loot`, `characters`, `statblocks`, `rules`, `dice`, `tables`, `pendientes`, `vault`, `backup`, `meta`.

Backend modules live in `apps/api/src/modules/<module>/` and follow the same public API shape (`index.ts`). Frontend modules live in `apps/web/src/modules/<module>/`. A module can only import another module through its `index.ts`.

## Quick start

```bash
npm install
cp .env.example .env   # Windows: Copy-Item .env.example .env
npm run db:migrate     # first run only; creates apps/api/prisma/dev.db
npm run dev
```

- Web: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:3001/api/v1/health>

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run db:generate` regenerates the Prisma client after schema changes. Prisma 7 writes it to `apps/api/src/generated/prisma` (ignored by git).

## Golden rules

These rules are mandatory for every change:

1. **New branch from the latest `dev`.** Never commit directly to `dev` or `main`.
2. **Back up the database before any database or Prisma change.** Run `npm run db:backup` before `prisma migrate dev`, schema changes or seeds.
3. **Prepare the revert before finishing a PR.** Every PR that touches the database must include `docs/revert/PR-<number>.md` with the backup path, migrations, code revert and verification steps.

Full workflow: [docs/REVERT-PLAYBOOK.md](docs/REVERT-PLAYBOOK.md). Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Backlog: [PENDIENTES.md](PENDIENTES.md).

## Privacy

This repository is public and **never** contains a real campaign. The campaign vault lives outside the repository and is never pushed. Do not commit:

- `DocMaterial/`, `vault/`, `respaldos/`, backups or `.env`.
- Campaign names, NPCs, maps, session notes or screenshots from a real table.
- The real vault path.

Tests and screenshots use the fictional demo campaign in `data/demo/` (Phase 4). CI runs a privacy check on every push.

## opencode agent team

The repository ships its own agent team in `.opencode/`:

| Agent | Role |
| --- | --- |
| `senior` | Orchestrator: plans, delegates, enforces the golden rules |
| `architect` | Module design, contracts, ADRs |
| `backend` | Express, Prisma, migrations |
| `frontend` | React, Tailwind, Query |
| `dnd-data` | SRD, CR/XP, loot, domain rules |
| `vault` | Obsidian adapters and sync |
| `continuity` | Pending threads, continuity checks, session briefing |
| `qa` | Unit, integration and E2E tests |
| `reviewer` | Read-only diff review |
| `docs` | README, AGENTS.md, ADRs |

Skills and commands are documented in `.opencode/skill/` and `.opencode/command/`.

## License

MIT. SRD attribution will be added in `NOTICE-SRD.md` before any SRD data is bundled (Phase 4).
