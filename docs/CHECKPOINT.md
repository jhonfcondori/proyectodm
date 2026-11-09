# Checkpoint de sesión — ProyectoDM

> Si acabas de recibir "continúa", lee este archivo completo antes de tocar nada.

- Fecha: 2026-11-08 21:26:47 -04:00

## Estado de ramas y PRs

- `dev` = `67903c7c8452f4495fa36a369e6b1a60b2ab4d3c` (squash de PR #1, Fase 1 fusionada).
- Rama de trabajo actual: `feat/f2-campaigns`, rebasada sobre `dev` (merge-base `67903c7`).
- Commits relevantes de la rama (en orden): `9b0131b` (funcional 2.1), `e58da25` (docs: correct squash-merge revert steps for PR-2), `b99a66b` (docs: refresh PR-2 revert metadata after rebase), `072b7f9` (docs revert PR-3), y el commit del checkpoint que se añadirá después.
- PR #1: FUSIONADO (squash `67903c7`).
- PR #2: CERRADO sin fusionar. Motivo: `gh pr merge 1 --delete-branch` borró `feat/f1-core`, que era su base, y GitHub lo cerró; no se pudo reabrir porque la rama se había force-pusheado. NO reutilizar el número 2.
- PR #3: ABIERTO, https://github.com/jhonfcondori/proyectodm/pull/3, base `dev`, head `feat/f2-campaigns`. CI en ROJO.
- Rama `feat/f1-core` fue recreada apuntando a `dev` (`67903c7`, tanto local como `origin`) solo para intentar reabrir PR #2; se puede borrar con seguridad.

## Qué está terminado

- Fase 1 completa y fusionada: monorepo, Prisma 7, migración `20261107192046_init`, `/api/v1/health`, RNG/dados seedables, vault adapter.
- Fase 2.1 Campañas: migración `20261108044135_f2_campaigns_status` (expand-only), backend `campaigns`, contratos `packages/shared/src/{api,campaigns}.ts`, `apps/api/src/http/{errors,handler}.ts`, frontend con react-router 7 + `AppLayout` + módulo `campaigns`.
- Verificación local en Windows: `npm run pr:ready` en verde, 119 tests (api 38, web 35, domain 16, shared 22, vault 8).

## Bloqueante actual (PRIMERO)

CI de PR #3 falla en `Lint, typecheck, test, build, privacy` (Linux) con 24 tests fallidos de `apps/api/tests/campaigns.test.ts`:
`Error: Could not locate the bindings file` en `@prisma/adapter-better-sqlite3` → `createBetterSQLite3Client`.
Causa probable: `better-sqlite3` no tiene su binding nativo compilado/descargado en el runner (revisar `npm ci --ignore-scripts` en `.github/workflows/ci.yml` y/o la caché de npm). Confirmado: el paso `Install dependencies` del workflow usa `npm ci --ignore-scripts`.
Pasos de diagnóstico ya hechos: `gh run view 42545195003 --log-failed`. El log muestra los 24 fallos en `tests/campaigns.test.ts` y el error de bindings; el resto de suites pasan.
Plan recomendado:
1. Revisar `.github/workflows/ci.yml` (paso `npm ci`) y quitar `--ignore-scripts` o añadir `npm rebuild better-sqlite3` en el job de test.
2. Si el binding sigue sin estar disponible, degradar el helper `apps/api/tests/helpers/test-db.ts` para hacer `skip` explícito de la suite de integración, NUNCA silenciar el fallo.
3. Verificar localmente con `npm run pr:ready` y pushear a `feat/f2-campaigns`.

## Pasos siguientes en orden

1. Arreglar CI de PR #3 y dejarlo en verde.
2. Crear tag `pre-merge-pr-3` sobre `dev` (`67903c7`) y pushearlo: `git tag pre-merge-pr-3 dev; git push origin pre-merge-pr-3`.
3. Fusionar PR #3 con squash: `gh pr merge 3 --squash` (sin `--delete-branch`).
4. Actualizar `docs/revert/PR-3.md` con el `Squash merge SHA` real y commitear (`docs:` commit en una rama corta desde `dev` o directamente en el PR de la siguiente sub-fase). Ojo: el campo `Feature head SHA` de `docs/revert/PR-3.md` quedó obsoleto (cita `b99a66b`; el tip real de la rama antes de este checkpoint era `072b7f9`).
5. Comentar y cerrar PR #2 remitiendo a #3.
6. Borrar la rama temporal `feat/f1-core` (`git push origin --delete feat/f1-core; git branch -D feat/f1-core`).
7. Arrancar **Fase 2.2 Sesiones** desde `dev` actualizado:
   - `git switch dev && git pull --ff-only origin dev`
   - `git switch -c feat/f2-sessions`
   - `npm run db:backup -- --label pre-f2-sessions` (OBLIGATORIO antes de tocar Prisma)
   - Diseño ya aprobado: `enum SessionStatus { DRAFT PLAYED CLOSED }`, `Session.status`, `Session.notePath String?`, índice `[campaignId, status]`, transiciones forward-only (`DRAFT→PLAYED→CLOSED`) con `409 INVALID_TRANSITION`, numeración automática `next-number`, UI de lista/detalle dentro de la campaña.
   - Revert doc con `npm run revert:prep -- --pr <nuevo> --branch feat/f2-sessions --backup <backup> --migrations f2_sessions_lifecycle`.
8. Después: 2.3 Wiki + tags, 2.4 FTS5, 2.5 Pendientes/continuidad (diseño completo en el historial; resumen en `PENDIENTES.md`).

## Reglas de oro (recordatorio)

- Rama nueva desde `dev`; nunca commit directo a `dev`/`main`.
- Backup de BD antes de cualquier cambio Prisma.
- `docs/revert/PR-<n>.md` antes de cerrar cada PR.
- Sin datos de campaña, rutas reales del vault, `.env`, `*.db`.
- Un commit = un cambio coherente; hooks pre-commit corren `privacy:check --staged`.

## Trampas conocidas

- NO usar `gh pr merge <n> --delete-branch` si otro PR apila sobre esa rama: cierra el PR hijo.
- Los agentes `edit`/`write` tienen denegados archivos de la raíz del repo; si hay que tocar `package.json`, `.dependency-cruiser.cjs`, `.gitignore`, etc., usar herramientas del sistema y reportarlo.
- El agente `qa` reportó en esta sesión ediciones que no hizo. Verificar siempre archivos y salidas.
- `prisma migrate reset --force` se ejecutó una vez sobre la BD local vacía (0 filas verificadas, backup previo). No repetirlo sin conteos y backup.
- `git revert -m 1` NO funciona aquí: el repo usa squash merge.
- El bundle web está en ~602 kB; hay code-splitting por ruta, el aviso >500 kB es preexistente.

## Cómo verificar el estado en 30 segundos

```powershell
git status --short
git log --oneline -5
gh pr list --state open
gh pr checks 3
npm run pr:ready
```

## Backup relacionado

- Pre-migración 2.1: `backups/db/proyectodm-20261108-004012-pre-f2-campaigns.db` (ruta relativa; el SHA256 consta en `docs/revert/PR-3.md`).
