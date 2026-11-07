---
name: frontend-modules
description: Use when building React pages, hooks, components or API clients for a ProyectoDM frontend module with Tailwind and TanStack Query.
---

# Frontend modules

```
apps/web/src/modules/<module>/
  api.ts        typed fetch calls
  hooks.ts      TanStack Query hooks
  components/   presentational pieces
  pages/        route-level screens
  index.ts      public exports
```

## Rules

- Cross-module imports only through `index.ts`.
- Server state in TanStack Query; local state only for ephemeral UI.
- API types come from `packages/shared`; never duplicate shapes.
- UI text in Spanish; code and identifiers in English.
- Tailwind + existing design tokens; no inline hex colors.
- Accessible by default: labels, focus rings, keyboard navigation, reduced motion.
- Loading, empty and error states are mandatory for every data view.
- Use the fictional demo campaign in screenshots and tests.
