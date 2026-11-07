---
name: project-modularity
description: Use when adding, moving or refactoring backend or frontend modules, when deciding where a file belongs, or when a cross-module import is needed.
---

# Project modularity

## Backend module

```
apps/api/src/modules/<module>/
  <module>.routes.ts
  <module>.service.ts
  <module>.repo.ts
  <module>.schema.ts
  index.ts
```

## Frontend module

```
apps/web/src/modules/<module>/
  api.ts
  hooks.ts
  components/
  pages/
  index.ts
```

## Rules

- Cross-module imports only through `index.ts`.
- No business logic in routes or React components.
- `packages/domain` has no I/O and no framework imports.
- `packages/shared` holds Zod contracts and DTOs.
- `packages/vault` only talks to the filesystem through `VaultAdapter`.
- Name modules after the domain concept, not the UI screen.

## Checklist

- [ ] Public API exported from `index.ts`.
- [ ] No deep import into another module.
- [ ] Contracts in `packages/shared`.
- [ ] Tests next to the module or in `test/`.
- [ ] Lint passes the dependency boundaries.
