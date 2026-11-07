# PENDIENTES — ProyectoDM (proyecto)

> Backlog de desarrollo. No mezclar con los pendientes de la campaña, que viven en el vault local (`00_Hub/Pendientes.md`).

## Estado actual

- [x] Fase 0 — Gobierno, repo, CI, backup/revert y equipo de agentes.
- [ ] Fase 0.5 — Fusión del vault local (fuera del repo).
- [ ] Fase 1 — Núcleo modular + Prisma + `/health`.
- [ ] Fase 2 — Campañas, sesiones, wiki, búsqueda y Pendientes.
- [ ] Fase 3 — Combat tracker.
- [ ] Fase 4 — SRD, generadores y loot.
- [ ] Fase 5 — Fichas, statblocks, dados y reglas.
- [ ] Fase 6 — Obsidian bidireccional y conflictos.
- [ ] Fase 7 — Tablas, backup UI, E2E y lanzamiento v1.0.0.

## Fase 1 — Núcleo modular

- [ ] Monorepo `apps/web`, `apps/api`, `packages/{shared,domain,vault}`.
- [ ] Express 5 + Vite + Prisma + Zod + lint de límites.
- [ ] Esquema inicial: `campaigns`, `sessions`, `entities`, `settings`.
- [ ] Migración inicial y `/health`.
- [ ] Scripts `dev`, `build`, `lint`, `typecheck`, `test`.

## Deuda técnica / decisiones abiertas

- [ ] Confirmar edición SRD: 5.1 (2014), 5.2 (2024) o ambas.
- [ ] Definir licencia definitiva: MIT (actual) o AGPL-3.0.
- [ ] README bilingüe ES/EN si el proyecto se internacionaliza.
- [ ] Activar branch protection en GitHub para `dev` y `main`.
- [ ] Configurar `gitleaks` local además de CI.

## Reglas de oro

1. Rama nueva desde el último `dev`.
2. Backup de DB antes de cambios de base de datos o Prisma.
3. Revert documentado al terminar cada PR.

Ver `AGENTS.md` y `docs/REVERT-PLAYBOOK.md`.
