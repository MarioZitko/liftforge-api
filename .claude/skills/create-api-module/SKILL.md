---
name: create-api-module
description: Use when adding a brand-new feature domain to the API — triggers like "add a new module for X", "create the X resource", "add CRUD endpoints for X". Scaffolds module/controller/service/dto following the proper @Module pattern. Do NOT use this to add a new controller method to an existing module (just add the method) or to extend one of the six loose-registered training-hierarchy modules (program/client-program/training/training-block/training-week/training-exercise) — follow their existing loose pattern instead, see .claude/docs/02-modules-and-dtos.md.
---

# Create a new API feature module

Scaffolds `src/modules/<name>/` using the proper `@Module` pattern — the standard for any new
domain per [`.claude/docs/02-modules-and-dtos.md`](../docs/02-modules-and-dtos.md). Reference
modules to copy the shape from: `exercise/`, `coach/`.

## Before you start — gather

- The domain's Prisma model — does it already exist in `prisma/models/`? If not, add it there and
  run `npm run prisma:generate` before writing the service.
- Which roles can access which operations (`CLIENT | COACH | ADMIN`).
- Whether this resource needs ownership scoping (does a coach/client only see their own rows?) —
  if so, this module must NOT skip the ownership check that's currently missing project-wide (see
  [`.claude/docs/04-refactor-backlog.md`](../docs/04-refactor-backlog.md) item 1) — don't
  perpetuate that gap in new code.

## Steps

1. `src/modules/<name>/<name>.module.ts` — proper `@Module` with `controllers`, `providers`, and
   `imports: [PrismaModule]` (explicit, even though it's global — for clarity).
2. `src/modules/<name>/<name>.controller.ts` — thin, guards + `@Roles()`, delegates to the service.
3. `src/modules/<name>/<name>.service.ts` — business logic + Prisma calls.
4. `src/modules/<name>/dto/create-<name>.dto.ts` + `update-<name>.dto.ts` — see the **add-dto**
   skill for the exact conventions (class-validator, `@ApiProperty`, `PartialType` from
   `@nestjs/swagger`).
5. Register the module in `src/app.module.ts`'s `imports` array (NOT its `controllers`/`providers`
   arrays — that's the loose pattern this new module should not join).
6. Add a `.spec.ts` per [`.claude/docs/03-testing.md`](../docs/03-testing.md) — provide real or
   explicitly-mocked dependencies, don't leave a DI-broken shell.

## Template — `<name>.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { <Name>Controller } from './<name>.controller';
import { <Name>Service } from './<name>.service';

@Module({
  imports: [PrismaModule],
  controllers: [<Name>Controller],
  providers: [<Name>Service],
})
export class <Name>Module {}
```

## Template — `<name>.controller.ts`

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { <Name>Service } from './<name>.service';
import { Create<Name>Dto } from './dto/create-<name>.dto';

@Controller('<name-plural>')
export class <Name>Controller {
  constructor(private readonly service: <Name>Service) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  @Post()
  create(@Body() dto: Create<Name>Dto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.userId);
  }
}
```

Match the exact guard/decorator import paths from an existing module (`exercise/exercise.controller.ts`)
before assuming these paths — they may differ slightly by module.

## Checklist (must all be true)

- [ ] Proper `@Module` — not registered loosely in `app.module.ts`'s `controllers`/`providers`.
- [ ] DTOs have `@ApiProperty()` on every field and use `PartialType` from `@nestjs/swagger`.
- [ ] Every write method that needs `createdById`/`updatedById` takes an explicit `userId`
  parameter (the CLS auto-audit extension doesn't work — see
  [`.claude/docs/01-coding-standards.md`](../docs/01-coding-standards.md)).
- [ ] Any resource scoped to a coach/client has an explicit ownership check
  (`resource.coachId === userId`, throwing `ForbiddenException`) — don't assume it's handled
  elsewhere.
- [ ] Multi-write sequences that must succeed/fail together use `this.prisma.$transaction(...)`.
- [ ] `.spec.ts` provides real or deliberately-mocked dependencies, not a bare `providers: [Service]`.
