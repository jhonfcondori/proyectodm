# PENDIENTES — ProyectoDM (proyecto)

> Backlog de desarrollo. No mezclar con los pendientes de la campaña, que viven en el vault local (`00_Hub/Pendientes.md`).

## Punto de continuación

> Antes de continuar, lee `docs/CHECKPOINT.md`. Estado de la sesión, PR abierto, bloqueante de CI y próximos pasos.

## Estado actual

- [x] Fase 0 — Gobierno, repo, CI, backup/revert y equipo de agentes.
- [x] Fase 0.5 — Fusión del vault local (fuera del repo).
- [x] Fase 1 — Núcleo modular + Prisma + `/health`.
- [ ] Fase 2 — Campañas, sesiones, wiki, búsqueda y Pendientes (en progreso: 2.1 Campañas completada).
- [ ] Fase 3 — Combat tracker.
- [ ] Fase 4 — SRD, generadores y loot.
- [ ] Fase 5 — Fichas, statblocks, dados y reglas.
- [ ] Fase 6 — Obsidian bidireccional y conflictos.
- [ ] Fase 7 — Tablas, backup UI, E2E y lanzamiento v1.0.0.

## Fase 1 — Núcleo modular

- [x] Monorepo `apps/web`, `apps/api`, `packages/{shared,domain,vault}`.
- [x] Express 5 + Vite + Prisma 7 + Zod + dependency-cruiser.
- [x] Esquema inicial: `Campaign`, `Session`, `Entity`, `Setting`.
- [x] Migración inicial y `/api/v1/health` con sonda SQLite.
- [x] Scripts `dev`, `build`, `lint`, `typecheck`, `test`, `db:*`.
- [x] Dashboard React con contrato Zod compartido y Tailwind 4.
- [x] RNG seedable, dados, frontmatter y adaptador de vault con tests.

## Fase 2 — Campañas, sesiones, wiki, búsqueda y Pendientes

- [x] 2.1 Campañas (CRUD, estado ACTIVE/ARCHIVED, listado/detalle, validación compartida).
- [ ] 2.2 Sesiones (siguiente; ver `docs/CHECKPOINT.md`).
- [ ] 2.3 Wiki de entidades + tags.
- [ ] 2.4 Búsqueda SQLite FTS5.
- [ ] 2.5 Pendientes y continuidad.

## Deuda técnica / decisiones abiertas

- [ ] Confirmar edición SRD: 5.1 (2014), 5.2 (2024) o ambas.
- [ ] Definir licencia definitiva: MIT (actual) o AGPL-3.0.
- [ ] README bilingüe ES/EN si el proyecto se internacionaliza.
- [ ] Activar branch protection en GitHub para `dev` y `main`.
- [ ] Configurar `gitleaks` local además de CI.
- [ ] Evaluar CORS/Helmet cuando exista despliegue cross-origin (hoy la API solo sirve en local con el proxy de Vite).
- [ ] Revisar el round-trip de `serializeNote` con cuerpos que terminan en múltiples saltos de línea (`packages/vault/src/frontmatter.ts`).
- [ ] `packages/vault/src/fs-adapter.ts`: `exists()` debe relanzar los errores distintos de `ENOENT` en lugar de devolver `false`.
- [ ] `apps/api/src/modules/health`: decidir si es un módulo de infraestructura exento de `repo`/`schema` o completar la convención; documentar la decisión en `docs/ARCHITECTURE.md`.
- [ ] Sustituir las reglas por módulo de dependency-cruiser (`no-cross-module-deep-import-*`) por un mecanismo escalable antes de la Fase 3; cada módulo nuevo exige reglas nuevas.
- [ ] `apps/api/package.json`: `@proyectodm/domain` y `@proyectodm/vault` aún sin uso; retirarlos hasta la Fase 4/6 o justificar su presencia.
- [ ] Añadir tests de componentes/hooks web (requiere jsdom + @testing-library/react).
- [ ] Evaluar `manualChunks` para bajar el entry de 602 kB (el bundle web supera el aviso de >500 kB); revisar antes de v1.0.0.
- [ ] Restaurar un `db:seed` real cuando exista seed de datos demo (el script se eliminó por no tener configuración).

## Notas de proceso

- [ ] PR-1: rellenar `Feature head SHA` en `docs/revert/PR-1.md` tras el primer commit y `Merge commit SHA` tras fusionar (ver `docs/REVERT-PLAYBOOK.md`).

## Reglas de oro

1. Rama nueva desde el último `dev`.
2. Backup de DB antes de cambios de base de datos o Prisma.
3. Revert documentado al terminar cada PR.

Ver `AGENTS.md` y `docs/REVERT-PLAYBOOK.md`.
