---
description: Implement or fix Obsidian vault adapters, serializers or two-way sync.
agent: vault
---

Vault task: $ARGUMENTS

1. Read `packages/vault` and the configured adapter.
2. Never hardcode a local path; use the adapter/config.
3. Preserve external edits; create `.conflict-<date>.md` instead of overwriting.
4. Keep frontmatter stable (`dm_id`, `dm_type`, `campaign`, `updated_at`).
5. Add fixture-based tests with fictional notes.
6. Run lint, typecheck and tests.
7. Report behavior, edge cases and files changed.
