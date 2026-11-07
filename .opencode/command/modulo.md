---
description: Scaffold a new backend and frontend module with contracts, routes, hooks and tests.
agent: senior
---

Module: $ARGUMENTS

1. Architect: confirm the domain name, responsibilities, contracts and endpoints.
2. Backend: create `apps/api/src/modules/<module>/{routes,service,repo,schema,index}.ts` and tests.
3. Shared: add Zod contracts in `packages/shared`.
4. Frontend: create `apps/web/src/modules/<module>/{api,hooks,components,pages,index}.ts(x)`.
5. QA: add API and UI tests with fictional fixtures.
6. Verify lint, typecheck, test, build and privacy check.
7. Update `PENDIENTES.md`.
