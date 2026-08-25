# Ticket structure — liftforge-api

Feature and fix work is tracked here as self-contained, paste-ready tickets — written so whoever
picks one up (a different session, a colleague, you in a month) doesn't need today's conversation
context to execute it. This mirrors the pattern used successfully on a sibling project
(`M3-AdminPanel`); adapted to this repo's simpler two-service setup.

## File layout

```
docs/
  README.md                        — this file
  phase-template.md                — copy this to start a new phase
  phase-<N>-tickets.md             — one file per phase, one ## heading per ticket
  phase-<N>-story-instructions.md  — OPTIONAL, only for a phase that needs upfront design/
                                      architecture decisions before tickets can be written
                                      (see "When to write a story-instructions doc" below)
```

Phases are numbered sequentially as they're planned (`phase-1`, `phase-2`, ...) — a phase is a
batch of related work, not a fixed time window.

## Ticket ID convention

**Use the existing GitHub issue number as the ticket ID** — this repo already names branches
`feature/<issue-number>` and commit messages `<issue-number> - <description>` (see `git log`).
Don't invent a new prefix scheme — reference the issue number directly.

**Heading format: `## <issue-number> - [BE] - <ticket title>`**, e.g.
`## 64 - [BE] - Exercise search endpoint`. This repo only files `[BE]` tickets (frontend work goes
in `liftforge-web/docs/`), but the tag is kept on every heading anyway so a ticket stays
identifiable once both repos' tickets are listed together. The number comes first and is
separated by ` - ` specifically so everything after the number can be copy-pasted straight in as
a Trello card title.

## What every ticket must contain

One `##` heading per ticket. Each ticket needs:

1. **Why** — the motivation/context in 1-3 sentences.
2. **Exact files to touch** — real paths in this repo. If a module already exists, say "read `X`
   first, mirror its existing pattern" rather than guessing at its current shape.
3. **Module pattern to follow** — state explicitly whether this is a new domain (use the proper
   `@Module` pattern — see [`.claude/skills/create-api-module/SKILL.md`](../.claude/skills/create-api-module/SKILL.md))
   or an extension of one of the six loose-registered training-hierarchy modules (follow their
   existing loose pattern instead — see
   [`.claude/docs/02-modules-and-dtos.md`](../.claude/docs/02-modules-and-dtos.md)).
4. **DTO shape, endpoints, and any ownership/RBAC requirement** — spelled out, not left implicit.
   If the resource is scoped to a coach/client, the ticket must call out that an ownership check is
   required (it isn't automatic anywhere in this codebase today — see
   [`.claude/docs/04-refactor-backlog.md`](../.claude/docs/04-refactor-backlog.md) item 1).
5. **Definition of Done** — a short checklist. This is a binding acceptance criterion — the
   `code-review` skill treats an unmet DoD bullet as a HIGH-severity finding.
6. **Dependencies / build order**, if the ticket depends on another ticket in this phase or on
   frontend work in `liftforge-web`.

## Reconciliation notes — read first, per phase file

Start each `phase-N-tickets.md` with a short "Reconciliation notes" section if anything has
drifted since the tickets were written (a schema change landed early, a decision changed, an
issue number got reassigned). If nothing has drifted, omit the section.

## When to write a story-instructions doc

Most phases just need `phase-N-tickets.md`. Write a `phase-N-story-instructions.md` first only
when the phase involves a genuine contract decision several tickets depend on (a new DTO shape
shared with the frontend, a schema/migration decision) — freeze that decision there, then derive
tickets from it.

## Cross-repo tickets

`liftforge-web` and `liftforge-api` are separate git repositories (siblings under
`Desktop/liftforge/`). When a ticket needs frontend work, put frontend tickets in
`liftforge-web/docs/phase-N-tickets.md` and reference them by repo + path
(`liftforge-web/src/api/exercises/exercises.api.ts`), not a relative `../` path. State the
cross-repo dependency explicitly in both tickets' "Dependencies" section — and per the contract-
freeze pattern in the reference project, finalize DTO field names/endpoint shapes in the backend
ticket *before* the dependent frontend ticket starts.

## Using these with the `code-review` skill

The [`code-review`](../.claude/skills/code-review/SKILL.md) skill automatically looks up which
`phase-N-tickets.md` a change belongs to (via branch name / issue number / recent commits) and
treats that ticket's DoD as a binding acceptance criterion — keep tickets accurate as work
progresses rather than letting them go stale.
