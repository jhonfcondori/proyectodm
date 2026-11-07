---
description: Plan and execute a local-only fusion of campaign vaults into one canonical Obsidian vault.
agent: senior
---

Fusion: $ARGUMENTS

1. Confirm the target is outside the repository and has no Git remote.
2. Inventory both sources: files, sizes, hashes and collisions.
3. Propose a canonical folder map and a collision policy (rename, merge, archive).
4. Deduplicate attachments by SHA256.
5. Copy with a dry-run manifest first; never delete the originals.
6. Validate wikilinks and frontmatter after the copy.
7. Report: files copied, collisions resolved, duplicates removed, manual review list.

Never upload or commit the fused vault.
