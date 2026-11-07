---
name: project-backlog
description: Use when updating the repository backlog PENDIENTES.md, planning a phase, or reporting what is done, in progress or blocked.
---

# Project backlog

The root `PENDIENTES.md` tracks the software project only. Campaign threads live in the local vault.

## Format

```
## Fase <n> — <name> [status]
- [ ] Task — acceptance criteria
- [x] Task — done
```

Status values: `pendiente`, `en curso`, `bloqueada`, `hecha`.

## Rules

- Update it in every PR.
- One line per deliverable, with a verifiable outcome.
- Blocked items include the blocker and the next action.
- Do not paste campaign plot, NPC names or session notes here.
- Keep phases aligned with `docs/ARCHITECTURE.md`.
- At the end of a phase, move completed items to a `Hecho` section and list follow-ups as new items.
