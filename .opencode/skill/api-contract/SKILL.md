---
name: api-contract
description: Use when adding or changing HTTP endpoints, request/response schemas, validation, pagination or error handling in apps/api.
---

# API contract

- Base path `/api/v1`.
- Validate every input with Zod from `packages/shared`.
- Success: `{ "data": ..., "meta": { ... } }`.
- Error: `{ "error": { "code": "...", "message": "...", "details": ... } }`.
- Pagination: `?page=1&limit=25`; `meta` returns `page`, `limit`, `total`.
- Status codes: 400 validation, 401 auth, 404 missing, 409 conflict, 422 business rule.
- Never leak stack traces or database errors.
- Generate OpenAPI later from the same Zod contracts; do not duplicate shapes.
- Every endpoint gets a Supertest test with a temporary SQLite database.
