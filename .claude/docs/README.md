# LiftForge API — Claude docs

Deeper, verified reference material that supplements the root [`CLAUDE.md`](../../CLAUDE.md). The
root file covers the project overview (tech stack, folder map, domain model, auth flow, response
envelope, Prisma workflow) — read it first if you haven't. This folder goes deeper on conventions
and known issues, and is loaded automatically alongside the root file via its `@.claude/docs/...`
imports.

## How to use these docs

- **Adding or touching a module, controller, or DTO?** [02-modules-and-dtos.md](02-modules-and-dtos.md) —
  which module-registration pattern to follow, DTO conventions, and the missing-ownership-check gap.
- **Writing service logic** (transactions, audit fields, logging, error handling)?
  [01-coding-standards.md](01-coding-standards.md).
- **Adding or fixing tests?** [03-testing.md](03-testing.md) — the suite currently fails on 20/21
  suites; read this before assuming any module "has coverage."
- **Not sure if something is a known issue or a new one?** Check
  [04-refactor-backlog.md](04-refactor-backlog.md) first — verified by actually running the
  commands, not just reading code.

## Document index

| # | Document | What it covers |
|---|---|---|
| 01 | [coding-standards.md](01-coding-standards.md) | Transactions, the (currently broken) CLS audit-field pattern, refresh-token lookup, logging, `any` usage, response/error handling, lint/format tooling caveats. |
| 02 | [modules-and-dtos.md](02-modules-and-dtos.md) | The two module-registration patterns (proper `@Module` vs. loose), DTO conventions, authorization pattern and its current gaps. |
| 03 | [testing.md](03-testing.md) | Current state (suite is broken beyond one placeholder test), how to fix it, conventions to follow once it's real. |
| 04 | [refactor-backlog.md](04-refactor-backlog.md) | Known issues, prioritized, verified by running `npx jest` / `npm run lint` on this checkout — a working list, not a permanent record. |

## The one-sentence summary

> NestJS 11 + Prisma 6 REST API where the response envelope and DI wiring are solid, but two
> real gaps need attention before this scales: **no resource-ownership checks anywhere** (any
> coach/client can touch another's data by ID) and **the audit-trail (`createdBy`/`updatedBy`) auto-fill
> extension is a silent no-op** due to middleware/guard ordering — both documented with exact fixes
> in the docs above.

## ⚠️ Known inconsistencies (don't carry these into new code)

Full detail and file references are in [04-refactor-backlog.md](04-refactor-backlog.md). The
recurring ones to keep front-of-mind:

- **No `ForbiddenException` / ownership check anywhere.** Existence (`NotFoundException`) is
  checked, ownership never is. Don't assume it's handled elsewhere for a new endpoint.
- **`update()` methods never set `updatedById`** — the CLS auto-audit extension doesn't work; only
  explicit `userId` params (used correctly for `create()`) actually populate audit fields.
- **`npm run lint` and `npx jest` are both currently broken** on this checkout (config bugs, not
  code-quality signal) — verify locally before trusting either as a gate.
- **Two DTO definitions for `User`** (`user.dto.ts` vs `dto/create-user.dto.ts`) — only the flat one
  is wired in; don't add a third.

## Ticket structure

Feature/fix work for this repo is tracked as tickets under the project-root [`docs/`](../../docs/)
folder (`docs/phase-N-tickets.md`), not under `.claude/`. See [`docs/README.md`](../../docs/README.md)
for that convention.
