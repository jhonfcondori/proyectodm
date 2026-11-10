# Architecture

## Goals

- Local-first: the DM runs one command and everything works offline.
- Modular: each feature is an isolated backend + frontend module with an explicit public API.
- Obsidian-friendly: markdown + YAML frontmatter + wikilinks, no community plugin required.
- Deterministic: generators use a seedable RNG; there is no AI inside the app.
- Safe to evolve: database changes are backed up and reversible.

## Monorepo

```
apps/web/                 React + Vite + TypeScript + Tailwind
apps/api/                 Express + TypeScript + Prisma + SQLite
packages/shared/          Zod contracts and shared types
packages/domain/          Pure D&D rules (no I/O, no framework imports)
packages/vault/           Obsidian adapters, serializers, sync engine
data/demo/                Fictional demo campaign (public)
data/srd/                 SRD data with attribution
docs/                     Architecture, playbooks, briefings, revert docs
scripts/                  db backup/restore, revert prep, privacy check
```

## Module boundaries

Backend module:

```
apps/api/src/modules/<module>/
  <module>.routes.ts
  <module>.service.ts
  <module>.repo.ts
  <module>.schema.ts
  index.ts
```

Frontend module:

```
apps/web/src/modules/<module>/
  api.ts
  hooks.ts
  components/
  pages/
  index.ts
```

Rules enforced by lint (dependency-cruiser):

- A module can only import another module through its `index.ts`.
- `apps/web` may import `packages/shared` and `packages/domain`.
- `apps/api` may import `packages/shared`, `packages/domain` and `packages/vault`.
- `packages/domain` imports no app or framework code.
- `packages/vault` exposes `VaultAdapter`; the filesystem adapter is the default.

Cross-module rule note: route-level code splitting (see Frontend) imports modules
through their public `index.ts`, so the lazy boundaries respect the same rule.

## Backend composition (dependency injection)

The API is composed, not singleton-wired:

- `createApp(deps)` in `apps/api/src/app.ts` receives its dependencies explicitly.
  `deps.prisma` is **optional** (`PrismaClient`), so health-only tests can build
  the app without a database.
- Modules that need the database are mounted only when their dependency is
  present: `/api/v1/health` is always mounted; `/api/v1/campaigns` and
  `/api/v1/sessions` (plus the campaign-scoped session routes) are mounted
  only when `deps.prisma !== undefined`. When the dependency is missing the
  module is simply not registered (no route, no 500).
- Repositories receive `PrismaClient` **by parameter** (first argument), never
  the `db.ts` singleton, so tests can inject a client bound to a temporary
  database. Services orchestrate repositories; routes wire `validate` +
  `asyncHandler` and read the parsed input via `getValidated(response)`.
- Backend module layout (all under `apps/api/src/modules/<module>/`):
  `<module>.routes.ts` (router factory, takes deps), `<module>.service.ts`
  (use cases, HTTP-agnostic apart from `HttpError`), `<module>.repo.ts`
  (Prisma queries), `<module>.schema.ts` (module-local re-export of the
  shared contracts so the module imports them through its own boundary),
  `index.ts` (public API). Cross-cutting HTTP helpers live in
  `apps/api/src/http/` (`errors.ts`, `handler.ts`). The `health` module
  currently ships only `routes`/`service`; whether that is a permanent
  exemption from the `repo`/`schema` convention is an open decision (see
  `PENDIENTES.md`).

## Data ownership

| Data | Source of truth |
| --- | --- |
| Narrative notes, wiki | Obsidian vault (markdown) |
| Session metadata and lifecycle (number, status, played date, note link) | SQLite |
| Structured state: combat, dice history, loot inventory | SQLite |
| Search index | SQLite FTS5 (rebuilt from both) |

The database mirrors vault content for search and structured state, but never silently overwrites a newer vault file. Conflicts create a `.conflict-<date>.md` copy.

## Database

- Prisma 7 + SQLite with the `better-sqlite3` driver adapter.
- `DATABASE_URL="file:./apps/api/prisma/dev.db"`; paths are resolved from the repository root.
- Schema: `apps/api/prisma/schema.prisma`; config: `prisma.config.ts`.
- Generated client: `apps/api/src/generated/prisma` (ignored by git).
- FTS5 virtual tables are created with manual SQL migrations because Prisma does not model virtual tables.
- Every schema change requires a backup before `npm run db:migrate`.
- SQLite rollback is restore-from-backup. Prisma migrations are forward-only.
- Destructive changes use expand/contract across separate PRs.

### Decision: `Campaign.name` uniqueness is application-level, not a DB constraint

`Campaign.name` has **no** `@@unique` constraint (see `apps/api/prisma/schema.prisma`
and migration `20261108044135_f2_campaigns_status`, which only adds
`Campaign.status` with default `ACTIVE` and the composite index
`[status, updatedAt]`). Uniqueness is enforced in the service layer
(`existsByName` → `409 CONFLICT`), with Prisma `P2002` mapped to `409` as a
race safety net (`fromPrismaError`).

Reason: this is a local, single-user app and the database holds user data. A
DB unique index would have forced the migration to dedupe existing rows (a
data-mutating `UPDATE`) or fail on install. Application-level uniqueness keeps
migrations additive and never rewrites user data. Do not add `@@unique([name])`
without a separate expand/contract plan.

### Decision: session lifecycle is forward-only

Sessions carry a `SessionStatus` (`DRAFT -> PLAYED -> CLOSED`) and are numbered
per campaign (`number`, unique with `campaignId`). Decisions:

- Lifecycle changes use `POST /api/v1/sessions/:id/transition`, not a `PATCH`.
  Only the next status is accepted; skips, backwards moves and no-ops return
  `409 INVALID_TRANSITION` with `{ from, to }` details. The transition table is
  shared (`SESSION_NEXT_STATUS`, `canTransitionSession`) so the UI renders only
  valid actions.
- `POST /campaigns/:campaignId/sessions` assigns `number = max(number) + 1`
  server-side; clients cannot choose it. `GET .../sessions/next-number` exposes
  the same calculation for the create-form preview. A concurrent create can hit
  the unique index and surfaces as `409 CONFLICT`.
- Moving to `PLAYED` stamps `playedAt` with the current time when it was empty;
  an explicit date is never overwritten.
- `notePath` is a nullable forward link to the vault note; the vault module
  (phase 6) is the only writer. Narrative session notes stay in the vault.

## Obsidian integration

`packages/vault` defines:

```ts
interface VaultAdapter {
  readonly root: string;
  listNotes(): Promise<VaultNoteRef[]>;
  readNote(path: string): Promise<VaultNote>;
  writeNote(note: VaultNote): Promise<void>;
  exists(path: string): Promise<boolean>;
}
```

Adapters:

1. `FsVaultAdapter` — default, no plugin needed.
2. `LocalRestApiVaultAdapter` — optional, requires the Obsidian Local REST API community plugin.
3. A custom Obsidian plugin bridge — future work.
4. `watch(onChange)` will be added with the bidirectional sync engine in Phase 6.

Frontmatter on exported notes includes a stable `dm_id`, `dm_type`, `campaign` and `updated_at`.

## API

- Base path: `/api/v1`.
- Validation with Zod contracts from `packages/shared`. The `validate`
  middleware (`apps/api/src/http/handler.ts`) parses body/query/params and
  stores the coerced values on `res.locals.validated` (Express 5 `req.query`
  and `req.params` are getters, so the request is not mutated); handlers read
  them via `getValidated(response)`. Calling `getValidated` without the
  middleware is a technical 500.
- Response envelope (uniform across routes):
  - Success, single resource: `{ data }`.
  - Success, paginated list: `{ data, meta }` where
    `meta = { page, limit, total, totalPages }`.
  - Error: `{ error: { code, message, details? } }` (`details` optional).
- Success example: `201 { "data": { ...campaign } }`;
  list example: `200 { "data": [...], "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 } }`;
  error example: `409 { "error": { "code": "CONFLICT", "message": "A campaign with this name already exists" } }`.
- Error codes and statuses (`ApiErrorCode` in `packages/shared/src/api.ts`):
  - `400` `VALIDATION_ERROR` — Zod parse failure or malformed JSON body.
  - `404` `NOT_FOUND` — missing resource; also the envelope returned for unknown routes.
  - `409` `CONFLICT` — e.g. duplicate campaign name (`existsByName`, or a `P2002` race).
  - `500` `INTERNAL_ERROR` — anything unexpected; internal details never leak.
  - `INVALID_TRANSITION` and `VAULT_UNAVAILABLE` are reserved in the shared
    `ApiErrorCodeSchema` but not emitted by any current route.
- `fromPrismaError` (`apps/api/src/http/errors.ts`) maps known Prisma errors:
  `P2002` → `409 CONFLICT`, `P2025` → `404 NOT_FOUND`. Detection is structural
  (`error.code`), not `instanceof`.
- `GET /api/v1/health` is the exception: it returns the shared
  `HealthResponse` directly so monitoring can read it without unwrapping.
- Pagination: `?page=&limit=` (coerced to integers; `page` ≥ 1,
  `limit` 1..100; defaults `page=1`, `limit=20`), implemented in
  `PageQuerySchema` and extended by list endpoints.

## Frontend

- React 19 + Vite + TypeScript + Tailwind 4, with TanStack Query for server
  state. Entry: `apps/web/src/main.tsx` (`QueryClientProvider`) →
  `apps/web/src/App.tsx`.
- SPA router: `react-router` 7 in **library mode** (`BrowserRouter` +
  `Routes` + `Route`). No data router, loaders, actions or SSR; plain
  client-side routing.
- Route-level code splitting: every page is a `React.lazy` import wrapped in
  `Suspense` (`App.tsx`), so each route ships its own async chunk. Cross-module
  lazy imports go through the module's public `index.ts`.
- Layout: `AppLayout` is a layout route (`<Route element={<AppLayout />}>`)
  rendering shared chrome with an `<Outlet />`; `/` redirects to `/campaigns`;
  unknown paths render `NotFoundPage`.
- UI primitives live in `apps/web/src/components/ui/` (`Badge`,
  `ConfirmDialog`, `EmptyState`, `InlineError`, `PageHeader`, `Skeleton`).
- Frontend module layout (`apps/web/src/modules/<module>/`): `api.ts`
  (fetchers + Zod response parsing), `hooks.ts` (TanStack Query hooks),
  `components/`, `pages/`, `index.ts` (public API). Campaigns also keep
  pure helpers (`delete-confirmation.ts`, `form-diff.ts`) beside the components.
- HTTP access goes through `apps/web/src/lib/api-client.ts`
  (`requestJson`): it validates every response with a Zod schema and throws
  `ApiClientError` (status + stable code) carrying the backend error envelope.
  `apiErrorMessage` maps stable codes to Spanish UI copy; the API itself
  returns English messages.
- The production entry chunk is ~602 kB (Vite's >500 kB warning is
  pre-existing); route-level chunks are split out, but the shared entry is not
  yet tuned (`manualChunks` evaluation is tracked in `PENDIENTES.md`).

## Security and privacy

- The server binds to `127.0.0.1`.
- Public repository: no campaign data, no real vault path, no secrets.
- `.env` is ignored; `.env.example` is committed.
- CI runs `gitleaks` and `privacy:check` on every push and PR.
