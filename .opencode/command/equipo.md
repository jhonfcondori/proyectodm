---
description: Choose and launch the right specialist team preset for a task.
agent: senior
---

Task: $ARGUMENTS

Pick one preset and justify it:

- `equipo-core`: architect + backend + frontend + qa
- `equipo-datos`: dnd-data + backend + qa
- `equipo-vault`: vault + backend + continuity + qa
- `equipo-continuidad`: continuity + vault + docs
- `equipo-review`: reviewer + qa

Write the delegation prompts (objective, context, allowed files, acceptance criteria, verification) and launch independent agents in parallel. If no agent fits, emit `SOLICITUD DE EQUIPO`.
