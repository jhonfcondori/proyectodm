---
description: Start a feature on a new branch from latest dev, plan it, delegate and verify.
agent: senior
---

Feature: $ARGUMENTS

1. Read `AGENTS.md`, `docs/ARCHITECTURE.md` and `PENDIENTES.md`.
2. Create the branch: `git fetch origin`, `git switch dev`, `git pull --ff-only origin dev`, `git switch -c feat/f<phase>-<slug>`.
3. If the feature touches the database, back up first: `npm run db:backup -- --label <label>`.
4. Split the work and delegate to the right specialists (architect, backend, frontend, dnd-data, vault, qa).
5. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run privacy:check`.
6. Run `npm run revert:prep -- --pr <number> --branch <branch>` when a database change exists.
7. Update `PENDIENTES.md` and report branch, tests, backup and revert document.
