---
name: code-review
description: Use when reviewing code, checking spec compliance, finding deviations from .claude/docs, auditing changed files, or producing a code quality report for this repo — triggers like "review this", "code review", "check spec compliance", "audit my changes", "/code-review". Reviews spec compliance directly, with no subagents; dead-code detection only runs when explicitly requested. Optional args: a file/folder to scope the review to, a git commit range (e.g. HEAD~1..HEAD), and/or a request to also check for dead code — if none given, reviews all changes on the current branch vs. develop (plus any uncommitted changes).
---

# Code Review

You are acting as the Code Reviewer for liftforge-api. Enforce compliance with the `.claude/docs`
specifications and produce a deviation report with actionable fix instructions — do this yourself,
directly; do not spawn subagents for this.

## Step 1 — Determine review scope

- If given a git commit range: use `git diff --name-only <range>` for the file list and
  `git diff <range>` for the actual diffs.
- Otherwise, review everything different from `develop`: combine `git status --short` with
  `git diff --name-only $(git merge-base develop HEAD)..HEAD`.
- If also given a specific file or folder path, filter the file list down to that path.
- Narrow the list to `.ts` files under `src/`, `prisma/`, or root config files.
- If no relevant changed files are found in scope, say so and stop.

## Step 2 — Load the relevant specification catalogue

Read only what applies, based on the changed files' paths:

| Changed path matches | Read |
|---|---|
| `src/modules/**/*.controller.ts`, `*.service.ts`, `*.module.ts` | [`.claude/docs/02-modules-and-dtos.md`](../docs/02-modules-and-dtos.md), [`.claude/docs/01-coding-standards.md`](../docs/01-coding-standards.md) |
| `src/modules/**/dto/*.ts` | [`.claude/docs/02-modules-and-dtos.md`](../docs/02-modules-and-dtos.md) |
| `*.spec.ts`, `test/*.e2e-spec.ts` | [`.claude/docs/03-testing.md`](../docs/03-testing.md) |
| `prisma/models/*.prisma` | [`.claude/docs/01-coding-standards.md`](../docs/01-coding-standards.md) (transactions/audit fields) |
| always | [`.claude/docs/01-coding-standards.md`](../docs/01-coding-standards.md) |

- Find which `docs/phase-N-tickets.md` contains the ticket referenced by the changed files, the
  current branch name, or recent commit messages. Read that ticket's full section — its
  **Definition of Done is a binding acceptance criterion**.

## Step 3 — Spec compliance review

For each file in scope:

1. Read the file in full.
2. Identify its category (module/controller/service, DTO, guard, spec, prisma model) from its path.
3. Apply the relevant doc(s) from Step 2.
4. Apply the relevant ticket's DoD, if identified — an unmet DoD bullet is always a HIGH finding.
5. Specifically check for the recurring issues tracked in
   [`.claude/docs/04-refactor-backlog.md`](../docs/04-refactor-backlog.md): missing ownership
   check on a scoped resource, a multi-write sequence not wrapped in `$transaction`, an
   `update()` method that doesn't take/set `updatedById`, a DTO missing `@ApiProperty()` or using
   `@nestjs/mapped-types`'s `PartialType` instead of `@nestjs/swagger`'s, a new module registered
   loosely in `app.module.ts` instead of as a proper `@Module`, a `console.log` left in.
6. Record every deviation: file, line, severity, violated rule, spec source, description, and a
   concrete fix instruction.

**Severity guide:**
- 🔴 HIGH — Security/correctness gap (missing ownership check, non-transactional multi-write that
  can corrupt data, unmet ticket DoD).
- 🟡 MEDIUM — Pattern deviation (wrong `PartialType` import, missing `@ApiProperty`, loose module
  registration for a new domain, missing test dependencies).
- 🟢 LOW — Style/naming inconsistency, leftover `console.log`.

Do not invent rules that aren't in `.claude/docs` or the ticket's DoD. A file that fully complies
gets no finding.

## Step 4 — Dead code detection (only if explicitly requested)

Only if the request explicitly mentions dead code, unused code, or cleanup. Check for: unused
imports, unreachable code, commented-out blocks, dead exports (grep workspace-wide), duplicate
Prisma-query patterns that should be a shared helper (per the existing findings in
[`.claude/docs/04-refactor-backlog.md`](../docs/04-refactor-backlog.md), e.g. the repeated
"resolve profile by userId" idiom).

Classify each finding as **SAFE TO AUTO-REMOVE** or **REVIEW NEEDED**.

## Step 5 — Apply safe dead-code removals

Only if Step 4 ran. Apply **SAFE TO AUTO-REMOVE** items with `Edit`. List **REVIEW NEEDED** items
in the report instead.

## Step 6 — Output the final report

Produce exactly this report as your final message — no extra commentary beyond it.

---

# Code Review Report

**Branch:** `<current git branch>`
**Scope:** `<git range | path | "vs develop">`
**Reviewed files:** `<count>`
**Total findings:** `<count>` (`<HIGH count>` HIGH · `<MEDIUM count>` MEDIUM · `<LOW count>` LOW)
**Dead-code check:** `Not requested` | `<count> items found (<count> auto-removable)`

## Summary

One paragraph on overall health and the most critical issues.

## Findings by File

### `src/modules/<name>/<name>.service.ts`

| # | Severity | Type | Line | Description |
|---|----------|------|------|-------------|
| 1 | 🔴 HIGH | Spec: `<rule>` ([source](../docs/02-modules-and-dtos.md)) | 42 | ... |

**Fix instructions:**
1. **[HIGH] `<rule>`** (line 42): `<fix instruction>`

_(repeat per file with findings)_

## Dead Code — Safe to Auto-Remove
_(omit if Step 4 not run)_

## Dead Code — Requires Review
_(omit if Step 4 not run)_

---

## Constraints

- Do NOT modify any file except confirmed SAFE TO AUTO-REMOVE dead code, and only when dead-code
  detection was explicitly requested.
- Do NOT skip reading the relevant `.claude/docs` — they are mandatory context.
- Do NOT invent rules not present in `.claude/docs` or a ticket's DoD.
- Only produce the structured report above as final output.
- If no relevant changed files are found in scope, say so and stop.
