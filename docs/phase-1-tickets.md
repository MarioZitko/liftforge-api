# Phase 1 — Backend hardening & hygiene (Issues 62–66, 71–76, 79–82)

Converts the findings in [`.claude/docs/04-refactor-backlog.md`](../.claude/docs/04-refactor-backlog.md)
(snapshot 2026-08-24/25 against `develop`) into actionable tickets. Every finding here was verified
directly against this checkout — `npx jest`, `npm run lint`, and targeted greps were actually run,
not just read from code.

## Reconciliation notes — read first

- **Ticket numbers are shared with `liftforge-web`'s `docs/phase-1-tickets.md`.** Both repos draw
  from one combined numbering pool (62–85) rather than each having their own counter — this
  matches how `feature/<n>` branches are already named across both repos with no overlapping
  numbers. This file only contains the numbers that landed on backend work; the gaps (67–70,
  77–78, 83–85) are frontend tickets — see `liftforge-web/docs/phase-1-tickets.md`.
- All 15 tickets here are direct conversions of `.claude/docs/04-refactor-backlog.md` items —
  that doc remains the "why we think this" narrative; this file is the actionable version going
  forward. Update both together if scope changes.
- Ticket 82 (module-registration cleanup) is intentionally the largest/lowest-priority item here —
  it's real, but per the backlog doc's own note, it shouldn't be done incidentally alongside
  unrelated work.

## Build order

- **62–66 (HIGH) are independent of each other** — can be split across people/sessions freely.
- **62** (ownership checks) and **72** (transactions) both touch `training.service.ts`,
  `training-block.service.ts`, etc. — coordinate if worked in parallel to avoid merge conflicts,
  but neither blocks the other.
- **64** (fix Jest) should land before anyone relies on `.spec.ts` files as a real safety net for
  the other tickets' changes — not a hard dependency, but doing 64 first makes 62/72/73 safer to
  verify.
- **82** is a standalone spike/cleanup — schedule it separately, not squeezed into the same PR as
  anything else in this file.

---

## 62 - [BE] - Add resource-ownership checks across coach/client-scoped resources

**Why:** any authenticated coach or client can currently fetch or mutate another coach's/client's
`Program`, `TrainingBlock`, `TrainingWeek`, `Training`, `TrainingExercise`, or `ClientProgram` by
ID — services only check existence (`NotFoundException`), never ownership. `ForbiddenException` is
not used anywhere in `src/modules`. This is the single biggest correctness/security gap in the API.

**Depends on:** none.

**Module pattern:** modifies existing modules — not a new module.

### Files to touch

- `src/modules/program/program.service.ts`
- `src/modules/training-block/training-block.service.ts`
- `src/modules/training-week/training-week.service.ts`
- `src/modules/training/training.service.ts`
- `src/modules/training-exercise/training-exercise.service.ts`
- `src/modules/client-program/client-program.service.ts`

### Shape

For each `findOne`/`update`/`remove` method, after fetching the resource, verify the requesting
user owns it — directly (`program.createdById === userId`, the actual field name; the ticket's
"`coachId`" was aspirational) or via its parent chain for nested resources (a `TrainingWeek`'s
ownership is its parent `TrainingBlock`'s `Program.createdById`, etc.). Throw `ForbiddenException`
on mismatch. `ADMIN` bypasses ownership checks entirely (decision below).

Shared logic lives in `src/common/auth/ownership.util.ts`:
- `assertProgramAccess(prisma, { programId, fallbackCreatedById? }, user)` — used by `program`,
  `training-block`, `training-week`, `training`, `training-exercise`. A coach owns the resource
  iff they created the resolved `Program`; a client owns it iff that `Program` is assigned to them
  via a `ClientProgram`. `fallbackCreatedById` covers the edge case of a `TrainingBlock` not (yet)
  linked to any `Program` (`programId` is nullable there) — falls back to comparing the block's
  own `createdById`, coach-only (a client has no assignment path to an orphaned block).
- `assertClientProgramAccess(prisma, { coachId, clientId }, user)` — used by `client-program`.
  `Coach.id`/`Client.id` are distinct from `User.id`, so this resolves the `Coach`/`Client` row to
  its `userId` before comparing.

**Decisions (recorded per the DoD below):**
- **`ForbiddenException` (403), not 404.** Simpler to apply uniformly across all six services, and
  consistent with `modules-and-dtos.md`'s existing guidance to use `ForbiddenException` for
  ownership. The existence-confirmation trade-off is accepted for now; revisit only if it becomes
  an actual product concern.
- **`ADMIN` bypasses every ownership check.** Matches the `@Roles(Role.ADMIN)` pattern already used
  everywhere else in the API.
- Read access (`findOne`) is intentionally **not** coach-only: several `:id` routes already allow
  `Role.CLIENT` (a client legitimately views their own assigned program/training data), so
  "ownership" for a client means "this `Program` is assigned to me via a `ClientProgram`," not
  "I created it." Narrowing those routes to coach-only was not an option — it would have broken
  existing, in-use client flows.
- `update()` methods across all six services now take the `RequestingUser` param needed for the
  ownership check; per `coding-standards.md`'s known `updatedById` gap, they now also stamp
  `updatedById` explicitly while already touching these methods (`ClientProgram` has no
  `updatedById` column, so that one only gets the ownership check).
- **Not in scope:** `training-exercise.service.ts`'s `reorder()` still has no ownership check —
  it's not a `findOne`/`update`/`remove` per the ticket's shape, and unlike the other mutations it
  isn't gated by an initial resource fetch this pass could hook into. Worth a fast follow-up, flagged
  here rather than silently left.
- **Found during review, fixed in this pass — reparenting via update DTOs.** Every `Update*Dto`
  inherits its parent FK from `PartialType(Create*Dto)` (`programId` on `TrainingBlock`, `blockId`
  on `TrainingWeek`, `weekId` on `Training`, `trainingId` on `TrainingExercise`, `clientId` /
  `programId` / `coachId` on `ClientProgram`). The ownership check on `update()` only validated the
  resource's *current* parent chain — a non-admin owner could still supply a different parent id in
  the body and get the resource (and everything nested under it) silently reassigned into a program
  they don't own. Fixed with `assertNoReparenting()` in `ownership.util.ts`: non-admins may not
  change any of these fields via `update()` at all; only `ADMIN` can reparent.
- **`ClientProgram` with no `coachId` assigned becomes admin-only to update/remove for a `COACH`.**
  `assertClientProgramAccess` only grants coach access when `coachId` is set — an unassigned
  `ClientProgram` has no coach to own it, so this is the intended conservative behavior of adding
  real ownership checks (previously *any* coach could edit *any* `ClientProgram`, assigned or not).
  Not treated as a bug; flagged here in case product wants a different rule for the unassigned case.

### Definition of Done

- [x] Every `findOne`/`update`/`remove` in the six services above verifies ownership (direct or
  via parent chain) before acting.
- [x] Ownership failure throws `ForbiddenException` (403) — decided against `NotFoundException`
  (404); see decisions above. Applied consistently across all six services.
- [x] `ADMIN` bypass behavior decided and implemented consistently.
- [ ] Tests (once Issue 64 lands, or written alongside if you're comfortable fixing that spec's DI
  first) cover: owner succeeds, non-owner is rejected, admin succeeds regardless of ownership. Not
  done here — the whole suite is DI-broken (Issue 64) and fixing that is explicitly out of scope
  for this ticket per its own build-order note.
- [ ] Manual smoke test: existing coach/client flows in the app still work end to end. Not run —
  needs a live DB + a real coach/client/admin session; flag for whoever picks this up for review.

---

## 63 - [BE] - Fix the broken CLS audit-field auto-population (createdBy/updatedBy)

**Why:** `src/prisma/extensions/base-entity.extension.ts` is supposed to auto-populate
`createdById`/`updatedById` from CLS on every create/update, but it's a silent no-op —
`ClsUserMiddleware` runs before `JwtAuthGuard` in the request lifecycle, so `req.user` is
undefined when the middleware reads it. As a result, **no `update()` method anywhere in the
codebase currently sets `updatedById`.**

**Depends on:** none (touches the same service files as Issue 62 — coordinate if done in
parallel, but neither blocks the other).

### Files to touch

- `src/middleware/cls-user.middleware.ts`
- `src/app.module.ts` (middleware registration)
- `src/prisma/extensions/base-entity.extension.ts`
- Every `update()` method in `program.service.ts`, `training.service.ts`,
  `training-block.service.ts`, `training-week.service.ts`, `training-exercise.service.ts`

### Shape

Pick one approach and record the decision:
- **(a)** Fix the timing — move user-resolution into something that runs after `JwtAuthGuard`
  (an interceptor, or populate CLS from within the guard itself) so the extension actually works.
- **(b)** Drop the CLS extension and standardize on the explicit-`userId`-parameter pattern
  already used correctly for `create()` calls — thread `userId` through every `update()` method
  too, and set `updatedById` explicitly in the service.

**(b) is recommended** — it matches what already works for `create()`, needs no lifecycle
surgery, and is simpler to reason about than fixing Nest's middleware/guard ordering.

**Decision: (b).** Matches `create()`'s existing pattern and needed no lifecycle surgery.
Additionally:
- The `update()` methods in all five services already take the `RequestingUser` param (added
  incidentally by Issue 62's ownership work) and already stamp `updatedById: user.userId`
  explicitly — that part of this ticket was effectively done by the time this was picked up.
  Verified it's actually correct (see below), not just present.
- `getUserIdFromContext`/CLS was confirmed dead for **every** model, not just the five services
  in scope — `ClsUserMiddleware` never successfully populates CLS (the underlying timing bug),
  so the extension's `create` hook was equally a no-op for `exercise`, `client-program`, `user`,
  `client`, and `coach`, none of which set `createdById`/`updatedById` explicitly. Removing the
  extension doesn't regress those modules; they get the same (already-broken) behavior as before.
  Fixing audit-field coverage for those modules is out of scope here (not in "Files to touch").
- Removed, not left partially dead: `base-entity.extension.ts` and `extensions/utils.ts` (deleted),
  `extendedPrismaClient.ts` (deleted — `PrismaService` now extends `PrismaClient` directly),
  `cls-user.middleware.ts` (deleted), and all `ClsModule`/`ClsService` wiring in `app.module.ts`
  and `prisma.module.ts`. Confirmed via grep that nothing else in `src/` used CLS. Left the
  `nestjs-cls` package in `package.json` uninstalled-but-unused rather than touching the
  dependency tree — not in this ticket's file list.

### Definition of Done

- [x] Decision recorded (a or b) with reasoning.
- [x] Every `update()` method across the five services above sets `updatedById` correctly via the
  chosen mechanism.
- [x] Verified with a real update call that `updatedById` populates in the DB (not just that the
  code compiles) — booted the API against the local dev DB, registered+verified a coach, created
  a `Program`, `PATCH`ed it, and confirmed `updatedById` populated with the coach's user id in the
  response and DB.
- [x] If (b): the now-dead `base-entity.extension.ts` (or the parts of it that only handled
  update) removed, not left as unreferenced dead code.

---

## 64 - [BE] - Fix the Jest test suite (currently 20 of 21 suites fail)

**Why:** running `npx jest` on this checkout fails 20 of 21 suites. Two causes: (1) specs whose
source imports the `@/` path alias fail with `Cannot find module '@/...'` because the Jest config
in `package.json` has no `moduleNameMapper` for it; (2) specs that only register the class under
test in `providers`, with no real or mocked dependencies, fail with Nest DI resolution errors.
`user` and `email` modules have zero spec files. All 21 existing specs only assert
`expect(service).toBeDefined()` — none test real behavior.

**Depends on:** none.

### Files to touch

- `package.json` (`jest` config block)
- All 21 existing `*.spec.ts` files
- New spec files for `user` and `email` modules

### Shape

```json
"jest": {
  "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" }
}
```
(`rootDir` is already `src`, so the mapping is relative to that.) For each existing spec, either
provide a real `PrismaModule` import (preferred, per the root `CLAUDE.md`'s "use real DB, don't
mock Prisma" guidance for anything touching DB logic) or explicitly mock the dependencies that
make sense to mock (e.g. `EmailService` when testing `AuthService`).

### Definition of Done

- [ ] `moduleNameMapper` added; `@/`-import specs no longer fail on module resolution.
- [ ] All 21 existing spec files pass, each asserting real behavior for at least the primary CRUD
  path of the class under test — not just `toBeDefined()`.
- [ ] `user` and `email` modules get real spec files where they previously had none.
- [ ] `npm run test` is a trustworthy command again (currently isn't).

---

## 65 - [BE] - Fix `npm run lint` (currently fails outright, not just with findings)

**Why:** `eslint.config.mjs` has no config block with a `files` glob matching `**/*.ts`, so ESLint
reports every file "ignored" and exits with an error before linting anything — `npm run lint` is
not currently a real signal at all.

**Depends on:** none.

### Files to touch

- `eslint.config.mjs`

### Shape

Add a `files: ['**/*.ts']` entry (or equivalent) to the config object(s) that currently lack one,
so ESLint 9's flat config actually matches source files.

### Definition of Done

- [x] `npm run lint` completes (exits 0, or reports real findings — not a config error).
- [x] Whatever real lint findings this surfaces are triaged: either fixed here, or explicitly
  listed and deferred to a follow-up ticket — don't let a newly-revealed backlog get silently
  ignored just because it wasn't visible before. (All findings were Prettier-fixable formatting
  issues — trailing commas, quote style, missing final newlines — across 18 files; `--fix` resolved
  them all, no remaining errors/warnings.)

---

## 66 - [BE] - Fix O(n) refresh-token lookup (bcrypt compare against every user)

**Why:** `auth.service.ts`'s `refreshTokens()` and `getUserFromRefreshToken()` load every user
with a non-null `hashedRefreshToken` and run `bcrypt.compare` against each one in a loop on every
single refresh call — deliberately-slow hash compares, worsening linearly as the user base grows.

**Depends on:** none.

### Files to touch

- `src/modules/auth/auth.service.ts` (`refreshTokens()` ~line 188, `getUserFromRefreshToken()`
  ~line 215)
- Prisma schema (likely needs a new indexed column)

### Shape

Store a lookup-friendly identifier alongside the hashed refresh token (e.g. a separate indexed
token ID, or a `jti` claim embedded in the refresh token and stored alongside the hash) so the
lookup becomes an indexed query by that identifier, with the bcrypt compare only run once against
the single matched row — not a scan-and-compare against every user.

### Definition of Done

- [x] Refresh-token lookup is O(1) via an indexed column/identifier, not a linear scan. (Added
  `User.refreshTokenId` — a unique, indexed, non-secret lookup id issued alongside the bcrypt-hashed
  secret; the cookie carries `${lookupId}.${secret}`, so lookup is a `findUnique` by
  `refreshTokenId` with `bcrypt.compare` run once against the matched row.)
- [x] Existing login → refresh → logout flow still works end to end. (Verified manually against the
  dev DB: register → verify → login → refresh — old token rejected, new one rotated in — →
  `/auth/me` → logout. Jest suite is still broken per Issue 64, so this couldn't be verified via
  `npm test`.)
- [x] A Prisma migration is written and applied if a schema change is needed.
  (`20260826214432_add_refresh_token_lookup_id`; applied directly against the local dev DB rather
  than via `migrate dev`, which refused to run due to a pre-existing, unrelated drift on
  `TrainingExercise.volumeId` — not introduced by this change, flagging separately.)

---

## 71 - [BE] - Resolve duplicate `CreateUserDto`/`UpdateUserDto` definitions

**Why:** `src/modules/user/user.dto.ts` (the one the controller actually imports) and
`src/modules/user/dto/create-user.dto.ts` + `update-user.dto.ts` (unused, but has `@ApiProperty()`
decorators the flat version lacks) define two different versions of the same DTOs for the same
resource.

**Depends on:** none.

### Files to touch

- `src/modules/user/user.dto.ts`
- `src/modules/user/dto/create-user.dto.ts`
- `src/modules/user/dto/update-user.dto.ts`
- `src/modules/user/user.controller.ts`

### Shape

Recommended: finish the migration to the `dto/` folder (matches the convention every other module
uses) — update the controller's import, then delete `user.dto.ts`.

### Definition of Done

- [ ] Only one `CreateUserDto`/`UpdateUserDto` pair exists.
- [ ] `user.controller.ts` imports from `dto/`.
- [ ] `@ApiProperty()`/`@ApiPropertyOptional()` present on every field.

---

## 72 - [BE] - Wrap non-transactional multi-write sequences in `$transaction`

**Why:** `training.service.ts` `remove()`, `user.service.ts` `create()` and `delete()`, and
`training-exercise.service.ts` `reorder()` all perform sequential, un-transacted writes that can
leave the DB in an inconsistent state if a later step fails after an earlier one succeeds.

**Depends on:** none (touches `training.service.ts` — coordinate with Issue 62 if done in
parallel).

### Files to touch

- `src/modules/training/training.service.ts` (`remove()`, ~lines 256–267)
- `src/modules/user/user.service.ts` (`create()` ~lines 50–78, `delete()` ~lines 117–123)
- `src/modules/training-exercise/training-exercise.service.ts` (`reorder()`, ~lines 87–94)

### Shape

Wrap each identified sequence in `this.prisma.$transaction(...)`, matching the pattern already
used correctly in `training-exercise.service.ts` `create()` and `training.service.ts`
`scheduleProgram()`. For `reorder()`, replace the `Promise.all` over independent `update()` calls
with a `$transaction` array of the same updates.

### Definition of Done

- [ ] All four identified sequences wrapped in `$transaction`.
- [ ] Happy-path behavior unchanged (verified via tests once Issue 64 lands, or manually).
- [ ] A simulated mid-sequence failure (throw after the first write, in a quick manual test or a
  unit test with a mocked Prisma client) leaves no partial state.

---

## 73 - [BE] - Extract duplicated "resolve profile by userId" / "onlyMine filter" logic

**Why:** `training.service.ts`'s `findForCoachCalendar`/`findForClientCalendar` are ~65-line
near-identical blocks differing only in `coach.findUnique` vs `client.findUnique`;
`client-program.service.ts`'s `findForCoach`/`findForClient` repeat the same idiom; and
`program.service.ts` / `exercise.service.ts` both repeat the identical
`createdById ? {createdById: userId} : {OR:[{createdById:null},{createdById:userId}]}` "onlyMine"
filter verbatim.

**Depends on:** none.

### Files to touch

- `src/modules/training/training.service.ts`
- `src/modules/client-program/client-program.service.ts`
- `src/modules/program/program.service.ts`
- `src/modules/exercise/exercise.service.ts`

### Shape

Extract two small shared helpers (a reasonable home is a new `src/common/` utility, or a small
injectable service if it needs `PrismaService`): one for "resolve the coach/client profile id for
a given userId", one for the "onlyMine" Prisma where-clause builder. Use both in all four services
listed above.

### Definition of Done

- [ ] One shared helper for profile resolution, used by both `training.service.ts` and
  `client-program.service.ts`.
- [ ] One shared helper for the "onlyMine" filter, used by `program.service.ts` and
  `exercise.service.ts`.
- [ ] No behavior change — existing calendar/list endpoints return the same results as before.

---

## 74 - [BE] - Remove redundant `if (!user.userId) throw UnauthorizedException` guard clauses

**Why:** `program.controller.ts`, `exercise.controller.ts`, and `client-program.controller.ts`
each repeat this exact check, even though `JwtAuthGuard` already guarantees `user.userId` is
present by the time the handler runs.

**Depends on:** none.

### Files to touch

- `src/modules/program/program.controller.ts`
- `src/modules/exercise/exercise.controller.ts`
- `src/modules/client-program/client-program.controller.ts`

### Shape

Delete the redundant check in each affected controller method.

### Definition of Done

- [ ] Guard clause removed from all three controllers.
- [ ] No new TypeScript errors from `user.userId` being treated as possibly undefined downstream.

---

## 75 - [BE] - Fix the invalid `.prettierrc` configuration

**Why:** `.prettierrc` nests a `"rules"` object (an ESLint concept) inside the Prettier config,
which is not valid Prettier syntax — Prettier warns on every file and the intended
`endOfLine: "auto"` setting never actually takes effect, so `prettier --check` currently flags
~120 files (this checkout is CRLF; Prettier's default `endOfLine` is `lf`).

**Depends on:** none.

### Files to touch

- `.prettierrc`

### Shape

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "printWidth": 100,
  "endOfLine": "auto"
}
```
Remove the nested `"rules"` object entirely.

### Definition of Done

- [ ] `.prettierrc` is valid (no "ignored unknown option" warning from Prettier).
- [ ] `npx prettier --check "src/**/*.ts"` result is understood and reported honestly — this
  ticket fixes the *config*, not necessarily every file; decide separately (and note the decision
  here) whether a one-time repo-wide `prettier --write` is worth its own, separate, reviewed
  change.

---

## 76 - [BE] - Align `client`/`coach` DTOs with the rest of the codebase's Swagger/PartialType conventions

**Why:** `client` and `coach` create-DTOs are missing `@ApiProperty()` on their fields (incomplete
Swagger docs, unlike `exercise`/`program`/`training*`/`auth`), and their update-DTOs use
`PartialType` from `@nestjs/mapped-types` instead of `@nestjs/swagger` (which drops Swagger
metadata from the generated update-DTO docs).

**Depends on:** none.

### Files to touch

- `src/modules/client/dto/*.ts`
- `src/modules/coach/dto/*.ts`

### Shape

Add `@ApiProperty()`/`@ApiPropertyOptional()` to every field in the create DTOs; change the
`PartialType` import in both update DTOs from `@nestjs/mapped-types` to `@nestjs/swagger`.

### Definition of Done

- [ ] Swagger UI shows complete field documentation for client & coach create/update endpoints.
- [ ] Both update DTOs import `PartialType` from `@nestjs/swagger`.

---

## 79 - [BE] - Remove leftover debug `console.log` statements

**Why:** `user.controller.ts` has `console.log('Deleting user:', id)` in a DELETE handler;
`jwt.strategy.ts` logs the full decoded JWT payload on every authenticated request — a minor
info-leak into production logs, and neither is intentional logging infrastructure.

**Depends on:** none.

### Files to touch

- `src/modules/user/user.controller.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`

### Shape

Delete both `console.log` calls. If logging is genuinely wanted here, use Nest's `Logger` at
`debug` level instead of an always-on `console.log`.

### Definition of Done

- [ ] Both `console.log` calls removed.
- [ ] No decoded JWT payload logged anywhere by default.

---

## 80 - [BE] - Replace `console.error` with Nest `Logger` in the global exception filter

**Why:** `src/common/filters/http-exception.filter.ts` logs unhandled exceptions via
`console.error` instead of Nest's structured `Logger`, inconsistent with how logging should work
across the app.

**Depends on:** none.

### Files to touch

- `src/common/filters/http-exception.filter.ts`

### Shape

Instantiate a `Logger` (e.g. `new Logger(AllExceptionsFilter.name)`) and use `logger.error(...)`
in place of `console.error(...)`, preserving the same diagnostic info (message, stack, path).

### Definition of Done

- [ ] Filter uses Nest `Logger`, not `console.error`.
- [ ] Logged output still includes message, stack, and request path.

---

## 81 - [BE] - Add pagination to unbounded `findAll()` endpoints

**Why:** `coach`, `program`, `exercise`, and `client-program` `findAll()` methods all return
unbounded `findMany()` results — fine at today's data volume, risky as it grows.

**Depends on:** none. Frontend impact: file a matching `liftforge-web` ticket if any calling page
needs to be updated to send/consume pagination params once this ships.

### Files to touch

- `src/modules/coach/coach.service.ts` (+ controller)
- `src/modules/program/program.service.ts` (+ controller)
- `src/modules/exercise/exercise.service.ts` (+ controller)
- `src/modules/client-program/client-program.service.ts` (+ controller)

### Shape

Add `skip`/`take` (or `page`/`pageSize`) query params to each `findAll()` controller method, with
a sensible default page size (e.g. 50) applied when omitted — never a silent unbounded dump.

### Definition of Done

- [ ] All four `findAll()` endpoints accept pagination params and pass `skip`/`take` to Prisma.
- [ ] Default page size applied when params are omitted.
- [ ] `liftforge-web` follow-up ticket filed if any current caller needs updating.

---

## 82 - [BE] - [Spike] Module-registration cleanup — loose controllers/providers → proper `@Module`

**Why:** `program`, `client-program`, `training`, `training-block`, `training-week`, and
`training-exercise` — the entire core training-hierarchy domain — are registered as loose
controllers/providers directly in `app.module.ts` instead of as proper `@Module` classes.
`app.module.ts` will keep growing unboundedly as this domain grows, and it bypasses Nest's module
encapsulation entirely. This is a known, larger architectural cleanup — schedule it as its own
dedicated pass, not folded into unrelated work.

**Depends on:** none, but should not run concurrently with Issues 62/63/72/73 (same service files)
without coordinating — safest done as a standalone pass once those land.

### Subtasks

1. Confirm there's no circular-import obstacle to giving these six domains their own modules
   (check for cross-domain service injection between them first).
2. Create `<name>.module.ts` for each of the six domains, moving its controller/service
   registration out of `app.module.ts`'s `controllers`/`providers` arrays into the new module's
   own arrays.
3. Add each new module to `app.module.ts`'s `imports` array.
4. Boot the app and smoke-test at least one endpoint per migrated module.

### Definition of Done

- [ ] All six domains have their own `<name>.module.ts`.
- [ ] `app.module.ts`'s `controllers`/`providers` arrays no longer list anything from these six
  domains directly.
- [ ] App boots cleanly; one endpoint per migrated module verified working.
- [ ] [`.claude/docs/02-modules-and-dtos.md`](../.claude/docs/02-modules-and-dtos.md) updated to
  remove the "loose pattern" callout once this ships.
