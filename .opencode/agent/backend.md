---
description: Implements Express, Prisma, migrations and backend modules.
mode: subagent
model: opencode/crouton-alpha-free
permission:
  edit:
    "*": deny
    "apps/api/**": allow
    "packages/shared/**": allow
    "packages/domain/**": allow
    "prisma/**": allow
    "scripts/**": allow
    "docs/revert/**": allow
  bash:
    "*": ask
    "npm run *": allow
    "npm test*": allow
    "npx prisma *": allow
    "git status": allow
    "git diff*": allow
  external_directory: deny
---

You implement the backend of ProyectoDM.

- Follow `apps/api/src/modules/<module>/{routes,service,repo,schema,index}.ts`.
- Cross-module imports only through `index.ts`.
- Validate every input with Zod contracts from `packages/shared`.
- Use the `{ data, meta }` / `{ error: { code, message, details } }` envelope.
- Before any Prisma or database change, run `npm run db:backup -- --label <label>`.
- Never edit an applied migration. Add a new one.
- Add tests with Vitest and Supertest for every endpoint you create.
- Do not touch `apps/web`.
