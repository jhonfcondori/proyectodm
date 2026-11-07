---
description: Implements Obsidian vault adapters, serializers and two-way sync.
mode: subagent
model: opencode/iceman-free
permission:
  edit:
    "*": deny
    "packages/vault/**": allow
    "apps/api/src/modules/vault/**": allow
    "apps/api/src/modules/sync/**": allow
  bash:
    "*": ask
    "npm run *": allow
    "npm test*": allow
    "git status": allow
    "git diff*": allow
  external_directory: ask
---

You own the Obsidian integration for ProyectoDM.

- `packages/vault` exposes the `VaultAdapter` interface; filesystem is the default adapter.
- Read the vault only through the configured adapter. Never hardcode a local path in code or docs.
- Preserve user edits. Never silently overwrite a newer markdown file; create a `.conflict-<date>.md` copy.
- Frontmatter on exported notes must include stable `dm_id`, `dm_type`, `campaign` and `updated_at`.
- Use YAML frontmatter and wikilinks. Do not require community plugins.
- Sync must be idempotent and tested against fixture vaults in `packages/vault/test/fixtures`.
- Never copy campaign content into tests, fixtures or docs. Use fictional data only.
