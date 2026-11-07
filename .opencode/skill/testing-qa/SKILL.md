---
name: testing-qa
description: Use when writing or running tests, adding fixtures, or verifying lint, typecheck, build and privacy checks before a PR.
---

# Testing and QA

## Stack

- Vitest for unit and integration tests.
- Supertest for API endpoints with a temporary SQLite file.
- Playwright for critical end-to-end flows.
- Testing Library for React components.

## Rules

- Test behavior, not implementation details.
- Use fictional fixtures; never real campaign data.
- Generators: same seed must produce the same output.
- API tests: assert status, envelope and validation errors.
- Do not skip or weaken tests to make CI pass.
- Run before every PR:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run privacy:check
```

Report failures as `file:line` plus the smallest fix.
