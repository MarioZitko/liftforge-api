# Testing conventions — liftforge-api

## Current state — read this before assuming coverage exists

There are 21 `*.spec.ts` files (one per controller/service across most modules) but **the suite
is currently 100% non-functional beyond the placeholder root controller**: running `npx jest`
today produces 20 failed suites / 1 passed. Two distinct causes:

1. Specs whose source files import via the `@/` path alias fail with `Cannot find module '@/...'`
   — the Jest config in `package.json` has no `moduleNameMapper` entry for `@/*` → `src/*`, even
   though `tsconfig.json` defines that alias and newer modules use it.
2. Specs whose source files use relative imports still fail with Nest DI errors
   (`Nest can't resolve dependencies of the XController (?)...`) because every spec only registers
   the class under test in `providers`, with no real or mocked dependencies (`PrismaService`,
   guards, etc.) supplied.

All 21 specs follow the same trivial template and only assert `expect(service).toBeDefined()` —
none test actual business logic. `user` and `email` modules have **no spec files at all**. E2E
coverage (`test/app.e2e-spec.ts`) only exercises the root `/` route.

**Don't assume a module "has tests" because a `.spec.ts` file exists next to it** — check whether
it actually compiles and asserts something. Right now, none of them meaningfully do.

## If asked to fix the suite

1. Add `moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" }` to the `jest` block in `package.json`
   (note `rootDir` is already set to `src`, so the mapping is relative to that).
2. For each spec, either provide real `PrismaService`/dependencies via
   `Test.createTestingModule({ imports: [PrismaModule], controllers: [...], providers: [...] })`
   (preferred per the root `CLAUDE.md`'s "use real DB, don't mock Prisma" guidance for integration
   tests), or explicitly mock only the dependencies that make sense to mock for a pure unit test
   (e.g. `EmailService` when testing `AuthService`, since you don't want tests sending real
   emails) — but be deliberate about which one you're writing, and name/organize the test
   accordingly rather than leaving a DI-broken shell.

## Conventions to follow once tests are real

- Unit tests live next to the file they test (`*.spec.ts`) — already the convention, keep it.
- E2E tests go in `test/`, using the separate `test/jest-e2e.json` config — already the
  convention, keep it, and prefer adding real endpoint coverage here (auth flow, program/training
  CRUD) over the current root-route-only placeholder.
- Per the root `CLAUDE.md`: **use a real test database for tests that exercise DB logic — don't
  mock Prisma** for those. Reserve mocking for genuinely external dependencies (email sending,
  OAuth provider calls), not for the DB layer itself.
- Given [coding-standards.md](01-coding-standards.md) flags the missing ownership checks
  (`ForbiddenException`) and non-transactional multi-writes as real gaps, tests for those specific
  behaviors (once fixed) are good first candidates — they're exactly the kind of regression a
  "should be defined" test can't catch.
