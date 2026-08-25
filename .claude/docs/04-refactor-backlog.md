# Known issues / refactor backlog — liftforge-api

Snapshot taken 2026-08-24 against `develop` (verified by actually running `npx jest` and
`npm run lint` on this checkout, not just reading code). This is a working list — update or
remove entries as they're fixed, add new ones as they're found. Referenced from
[modules-and-dtos.md](02-modules-and-dtos.md), [coding-standards.md](01-coding-standards.md), and
[testing.md](03-testing.md); see those for "how to do it right," this file is just "what's currently
wrong and how bad it is."

**Every item below has been filed as an actionable ticket** in
[`docs/phase-1-tickets.md`](../../docs/phase-1-tickets.md) (Issues 62–66, 71–76, 79–82) — this doc
is the "why we think this" narrative; that file is where to check status/DoD/dependencies.

## High priority (correctness / security)

1. **No resource-ownership checks anywhere.** Any authenticated coach/client can fetch or mutate
   another coach's/client's `Program`/`TrainingBlock`/`TrainingWeek`/`Training`/`Client` by ID —
   services only check existence (`NotFoundException`), never ownership. `ForbiddenException` is
   never used in `src/modules`. This is the single biggest correctness/security gap. Needs a
   deliberate pass across `program`, `training-block`, `training-week`, `training`,
   `training-exercise`, `client-program` services to add `resource.coachId === userId` (or
   equivalent) checks.

2. **~~CLS-based audit field extension is a silent no-op~~ — fixed in Issue 63.** The extension
   (`src/prisma/extensions/base-entity.extension.ts`), `ClsUserMiddleware`, and all `nestjs-cls`
   wiring were removed; `program`, `training`, `training-block`, `training-week`,
   `training-exercise` now stamp `updatedById` explicitly in `update()`, matching the explicit-param
   pattern already used for `create()`. See [coding-standards.md](01-coding-standards.md) for the
   current pattern. Remaining gap (not this ticket's scope): `exercise`, `client-program`, `user`,
   `client`, `coach` still don't set `createdById`/`updatedById` on create/update at all — same as
   before, not a regression from the removal.

3. **Jest suite is 100% broken beyond the placeholder root controller** — 20 of 21 spec suites
   fail (missing `@/` alias mapping in Jest config + specs that don't supply real/mocked
   dependencies). See [testing.md](03-testing.md) for the fix. `user` and `email` modules have zero
   spec files. Treat "there are .spec.ts files" as no signal of actual coverage until this is
   fixed.

4. **`npm run lint` fails outright** — `eslint.config.mjs` has no config object with a `files:`
   glob matching `**/*.ts`, so every file is reported "ignored" and the command exits with an
   error instead of linting. One-line fix: add `{ files: ['**/*.ts'] }` (or similar) to the config
   array. Until fixed, lint is not a real CI/dev signal.

5. **O(n) refresh-token lookup with a bcrypt compare per row** in `auth.service.ts`
   `refreshTokens()`/`getUserFromRefreshToken()` — loads every user with a non-null
   `hashedRefreshToken` and loops `bcrypt.compare` against each one. Gets slower as the user base
   grows; should look up by an indexed identifier instead of scanning + hashing every candidate.

## Medium priority

6. **Duplicate `CreateUserDto`/`UpdateUserDto`** — `src/modules/user/user.dto.ts` (used by the
   controller) vs `src/modules/user/dto/create-user.dto.ts` + `update-user.dto.ts` (unused, has
   `@ApiProperty()` the flat version lacks). Resolve by finishing the migration to `dto/` and
   deleting `user.dto.ts`, or removing the dead `dto/` pair — don't leave both.

7. **Non-transactional multi-write sequences** that should use `$transaction`:
   `training.service.ts` `remove()`, `user.service.ts` `create()` and `delete()`,
   `training-exercise.service.ts` `reorder()`. See [coding-standards.md](01-coding-standards.md) for
   detail; `training-exercise.service.ts` `create()` and `training.service.ts`
   `scheduleProgram()` already show the correct pattern to copy.

8. **Duplicated "resolve profile by userId, then query" logic** copy-pasted rather than
   extracted: `training.service.ts`'s `findForCoachCalendar`/`findForClientCalendar` (~65-line
   near-identical blocks), `client-program.service.ts`'s `findForCoach`/`findForClient`, and the
   `createdById ? {...} : {OR:[...]}` "onlyMine" filter repeated verbatim in `program.service.ts`
   and `exercise.service.ts`. Worth a shared helper if touching any of these again.

9. **Redundant `if (!user.userId) throw new UnauthorizedException(...)` guard** repeated in
   `program.controller.ts`, `exercise.controller.ts`, `client-program.controller.ts` — `userId` is
   already guaranteed by `JwtAuthGuard`. Low-risk cleanup, not urgent.

10. **`.prettierrc` has a structurally invalid nested `"rules"` key** — the intended
    `endOfLine: "auto"` never applies, so `prettier --check` currently flags ~120 files (CRLF vs.
    Prettier's default LF). This is a config bug, not a real formatting regression — fix the
    config (move `endOfLine` to a top-level key, remove the invalid `rules` nesting) rather than
    mass-reformatting the repo.

11. **Inconsistent `client`/`coach` DTOs** — missing `@ApiProperty()` (incomplete Swagger docs),
    and using `PartialType` from `@nestjs/mapped-types` instead of `@nestjs/swagger` (drops
    Swagger metadata on update DTOs). Align with `exercise`/`program`'s pattern.

## Low priority / hygiene

12. Leftover debug statements: `user.controller.ts` (`console.log('Deleting user:', id)`),
    `jwt.strategy.ts` (`console.log('✅ JWT payload received:', payload)` — logs decoded JWT
    claims on every authenticated request, a minor info-leak into prod logs). Remove; use
    `Logger` if logging is actually needed there.
13. `http-exception.filter.ts` uses `console.error` instead of Nest's `Logger`.
14. No pagination on any `findAll()` (`coach`, `program`, `exercise`, `client-program`) — fine at
    current data volume, but add `skip`/`take` for new list endpoints rather than perpetuating
    unbounded queries.
15. Module-registration split (6 modules proper `@Module`, 6 registered loose in
    `app.module.ts` — the entire training hierarchy + client-program) is a known, larger
    architectural cleanup already flagged in the root `CLAUDE.md` as intentional-for-now. Don't
    fix incidentally; if it's ever tackled, do it as its own dedicated pass across all 6 modules
    at once.
