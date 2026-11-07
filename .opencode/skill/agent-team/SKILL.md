---
name: agent-team
description: Use when planning work that must be delegated to the ProyectoDM specialist agents, when choosing a team preset, or when no agent fits and a new team member must be requested.
---

# Agent team

`senior` orchestrates and never edits code. It delegates through the task tool.

## Roster

| Agent | Model | Responsibility |
| --- | --- | --- |
| architect | opencode/glm-5.3-flash-free | Boundaries, contracts, ADRs (read-only) |
| backend | opencode/crouton-alpha-free | Express, Prisma, migrations |
| frontend | opencode/mimo-v2.6-flash-free | React, Tailwind, TanStack Query |
| dnd-data | opencode/flint-40b-free | SRD data, domain rules, generators |
| vault | opencode/iceman-free | Obsidian adapters, serializers, sync |
| continuity | opencode/nemotron-3.5-super-vl-free | Campaign Pendientes/Briefing/Cierre |
| qa | opencode/nemotron-3.5-lightning-free | Tests and quality gates |
| reviewer | opencode/beam-free | Diff review (read-only) |
| docs | opencode/inkling-2-small-free | Technical documentation |

## Presets

- `equipo-core`: architect + backend + frontend + qa
- `equipo-datos`: dnd-data + backend + qa
- `equipo-vault`: vault + backend + continuity + qa
- `equipo-continuidad`: continuity + vault + docs
- `equipo-review`: reviewer + qa

## Delegation prompt

Include: objective, context files, exact files allowed, acceptance criteria, verification command, and what to return. Launch independent agents in parallel. Use `qa` before finishing and `reviewer` for high-risk changes.

## Missing role

Emit `SOLICITUD DE EQUIPO` with role, reason, responsibilities, suggested free model and tools. Do not improvise a new agent.
