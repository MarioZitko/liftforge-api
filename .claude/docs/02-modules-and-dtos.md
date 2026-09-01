# Module & DTO conventions — liftforge-api

Supplements the root [`CLAUDE.md`](../../CLAUDE.md), which already documents the standard
"proper module" shape and flags that some modules are registered as loose
controllers/providers directly in `app.module.ts`. This file goes deeper on what that means in
practice and how to handle DTOs consistently.

## Module registration — two coexisting patterns

- **Proper `@Module`** (has its own `<name>.module.ts`): `auth`, `user`, `client`, `coach`,
  `exercise`, `email`.
- **Loose, registered straight into `app.module.ts`**: `program`, `client-program`, `training`,
  `training-block`, `training-week`, `training-exercise` — i.e. the entire training-hierarchy
  domain. `app.module.ts` lists all 6 of these controllers and 6 services directly in its
  top-level `controllers`/`providers` arrays.

**When adding a new endpoint to one of the loose-pattern domains** (training/program/etc.),
follow the existing loose pattern for that specific domain rather than unilaterally converting it
to a proper module — that's a deliberate, larger refactor (tracked in
[refactor-backlog.md](04-refactor-backlog.md)), not something to do as a side effect of an unrelated
feature. **When adding a brand-new domain**, use the proper `@Module` pattern (`auth`/`exercise`
are good references) — don't grow the loose-registration list further.

## DTO conventions

- Every module has a `dto/` folder with `create-*.dto.ts` / `update-*.dto.ts`. Follow that;
  `update-*.dto.ts` should be `PartialType(Create*Dto)`.
- **Use `PartialType` from `@nestjs/swagger`**, not `@nestjs/mapped-types`. Most modules
  (`program`, `exercise`, `training*`, `client-program`) do this correctly; `client` and `coach`
  use the `@nestjs/mapped-types` version, which drops Swagger metadata from the generated docs for
  those update DTOs. Use the `@nestjs/swagger` import for any new/edited `update-*.dto.ts`.
- **Add `@ApiProperty()` to every DTO field**, even ones with straightforward types. `exercise`,
  `program`, `training*`, and `auth` DTOs do this; `client` and `coach` don't, and those modules'
  Swagger docs are visibly incomplete as a result. Match the `exercise`/`program` DTOs, not
  `client`/`coach`, when writing a new DTO.
- **Coerce numeric IDs from request bodies with `@Type(() => Number)`** (from
  `class-transformer`) when the field is a numeric FK arriving over JSON — see
  `create-client-program.dto.ts`'s `programId` for the one place this is done correctly. Several
  other DTOs (e.g. `create-training-block.dto.ts`'s `programId`) skip this; don't copy that
  omission into new DTOs.
- **Don't create a second DTO file for the same resource.** `src/modules/user/user.dto.ts` and
  `src/modules/user/dto/create-user.dto.ts`/`update-user.dto.ts` currently define two different
  `CreateUserDto`/`UpdateUserDto` pairs for the same resource — the controller only uses the
  flat `user.dto.ts` version, so the `dto/` folder pair is dead. If you're touching user DTOs,
  either finish the migration to `dto/` (update the controller import and delete `user.dto.ts`)
  or don't add a third version — resolve the duplication rather than growing it further.
- If you're adding a `name` + optional `description` pair to a new create-DTO (as `program`,
  `training-block`, `training-week`, and `training` all independently do), consider whether a
  shared base DTO makes sense before copy-pasting the pair again — ask if unsure, since this
  crosses several modules.

## Authorization pattern

- `@CurrentUser()` on a controller method gives you the JWT payload. `program`, `exercise`, and
  `client-program` used to each repeat a redundant `if (!user.userId) { throw new
  UnauthorizedException(...) }` guard clause even though `JwtAuthGuard` already guarantees
  `user.userId` is present — removed in Issue 74. Don't add it to a new controller; use
  `user.userId!` directly, matching every other method in these controllers.
- **There is currently no resource-ownership check anywhere** — e.g. nothing stops one coach from
  fetching or mutating another coach's `Program`/`TrainingBlock`/`Client` by guessing/incrementing
  an ID; services only check existence (`NotFoundException`), never ownership
  (`ForbiddenException` is not used anywhere in `src/modules`). If you're adding or touching a
  service method that fetches/updates/deletes a resource scoped to a coach or client, add an
  ownership check (`resource.coachId === userId`, throwing `ForbiddenException` otherwise) rather
  than assuming this is handled elsewhere — it currently isn't, for any resource.
