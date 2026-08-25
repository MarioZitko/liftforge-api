# Coding standards — liftforge-api

Supplements the root [`CLAUDE.md`](../../CLAUDE.md). See [modules-and-dtos.md](02-modules-and-dtos.md)
for module/DTO conventions specifically, and [testing.md](03-testing.md) for tests.

## Transactions

Wrap multi-write sequences in `this.prisma.$transaction(...)` whenever a partial failure would
leave inconsistent data. This is done correctly in some places (`training-exercise.service.ts`
`create()`, `training.service.ts` `scheduleProgram()`) — follow those as the reference. It is
**missing** in several places that should have it:
- `training.service.ts` `remove()` — deletes `Volume`, then `TrainingExercise`, then `Training`
  sequentially.
- `user.service.ts` `create()` — creates `User`, then conditionally a `Client`/`Coach` profile,
  as two separate calls (a failure after user creation orphans the user with no profile).
- `user.service.ts` `delete()` — three sequential deletes.
- `training-exercise.service.ts` `reorder()` — uses `Promise.all` over independent `update()`
  calls instead of `$transaction`, so a partial failure mid-reorder can leave inconsistent
  `sortOrder` values.

If you're touching any of the above, wrap them in `$transaction`. For new multi-write logic, ask
"if step 2 fails after step 1 succeeded, is the DB now in a bad state?" — if yes, use
`$transaction`.

## Audit fields (`createdBy`/`updatedBy`) — know this is currently broken

There's a Prisma Client Extension at `src/prisma/extensions/base-entity.extension.ts` that's
*supposed* to auto-populate `createdById`/`updatedById` from CLS (`ClsService`) on every
create/update. **It doesn't actually work**: `ClsUserMiddleware` runs as Express middleware
(registered `forRoutes('*')` in `app.module.ts`), which executes *before* `JwtAuthGuard` in Nest's
request lifecycle — so `req.user` (which the middleware reads to populate CLS) is undefined when
the middleware runs. The extension is a silent no-op.

**In practice, every service that needs `createdById` takes an explicit `userId` parameter passed
down from the controller's `@CurrentUser()`** — that's the pattern that's actually load-bearing,
not the CLS extension. Follow it for new code: pass `userId` explicitly into service methods that
need to stamp `createdById`, don't rely on the CLS extension populating it for you.

**Known gap:** `update()` methods across `training`, `program`, `training-block`,
`training-week`, `training-exercise` services take no `userId` parameter at all today, so
`updatedById` is never actually populated on updates anywhere. If you're touching any `update()`
method in these services, add the `userId` parameter and set `updatedById` explicitly — don't
assume the extension will do it.

Fixing the CLS wiring itself (so the extension actually works, e.g. by moving user-resolution
earlier or having the extension read `AsyncLocalStorage` populated by a guard instead of
middleware) is tracked as a real fix in [refactor-backlog.md](04-refactor-backlog.md) — it's a
bigger, deliberate change, not something to patch inline while doing unrelated work.

## Auth-specific: refresh token lookup

`auth.service.ts`'s `refreshTokens()` / `getUserFromRefreshToken()` currently load **every user
with a non-null `hashedRefreshToken`** and `bcrypt.compare` the incoming token against each one in
a loop. This gets slower (linearly) as the user base grows and runs a deliberately-slow hash
compare per row on every refresh call. Don't extend this pattern elsewhere. If you're touching
refresh-token logic, prefer looking the token up by an indexed identifier (e.g. store a token ID
separately from the hashed secret, or hash+index a stable portion of the token) rather than a
linear scan — flag this as a fix worth doing rather than working around it if you're in this file
for another reason.

## Pagination

No service currently paginates (`findAll()` on `coach`, `program`, `exercise`, `client-program`
all return unbounded `findMany()`). Don't add a new unbounded `findAll()` for a resource that can
grow without bound (anything client/coach-scoped, exercises, programs) — add `skip`/`take` (or
cursor pagination if you're matching the frontend's `ServerTable` expectations) for new list
endpoints even though older ones don't have it yet.

## Logging

- Use Nest's built-in `Logger`, not `console.log`/`console.error`. `src/common/filters/http-exception.filter.ts`
  currently uses `console.error`, and there are a couple of leftover debug statements
  (`user.controller.ts`'s `console.log('Deleting user:', id)`, `jwt.strategy.ts`'s
  `console.log('✅ JWT payload received:', payload)` — the latter logs decoded JWT claims on every
  authenticated request, which is an unnecessary info-leak into prod logs). Don't add new
  `console.log` debug statements; use `Logger` if you need to add logging, and remove the ones
  above if you're touching those files anyway.

## `any` usage

`@typescript-eslint/no-explicit-any` is deliberately turned off in `eslint.config.mjs`, so `any`
won't be flagged. It's currently used pragmatically in a few places in `auth.service.ts` and
`cls-user.middleware.ts`. Don't use it as a shortcut for a type you could otherwise express
reasonably — prefer the real payload/DTO type — but don't feel obligated to eliminate every
existing occurrence as a side task either.

## Response/error handling

- `AllExceptionsFilter` and `ResponseInterceptor` are global (registered in `main.ts`) — every
  route gets the `{ statusCode, timestamp, data }` / `{ statusCode, timestamp, path, message }`
  envelope automatically. Don't manually shape a response or manually catch-and-format an error in
  a controller; throw the appropriate Nest exception (`NotFoundException`, `ConflictException`,
  `BadRequestException`, `UnauthorizedException`, and — per
  [modules-and-dtos.md](02-modules-and-dtos.md) — `ForbiddenException` where ownership matters) and
  let the global filter handle it.
- The one legitimate exception: OAuth redirect handlers in `auth.service.ts`
  (`loginOAuthUser`/`handleOAuthRedirect`) write directly to the Express `Response` object
  (`res.redirect(...)`, `res.status(...).send(...)`) because they're browser redirects, not JSON
  API responses. This is intentional — don't "fix" it to return the JSON envelope, and don't use
  it as precedent to bypass the envelope for anything that *is* a JSON endpoint.

## Lint/format tooling — known broken, don't trust it blindly

- **`npm run lint` currently fails outright** (`eslint.config.mjs` has no config block with a
  `files:` glob covering `**/*.ts`, so ESLint reports every file as ignored and exits with an
  error before linting anything). This means lint is not currently a real signal — don't assume
  code is clean because "lint would have caught it." Fixing the config to add a
  `files: ['**/*.ts']` entry is a one-line fix worth doing if you're in this area (tracked in
  [refactor-backlog.md](04-refactor-backlog.md)), but don't silently "fix" it as a side effect of an
  unrelated PR without flagging it, since it'll surface a backlog of currently-unlinted issues.
- **`.prettierrc` has an invalid nested `"rules"` key** — Prettier ignores it, and the intended
  `endOfLine: "auto"` setting never takes effect, so `prettier --check` currently flags ~120 files
  (this checkout uses CRLF, Prettier defaults to LF). Don't mass-reformat the repo to "fix" this;
  it's a config bug, not a signal that the code itself is in bad shape.
