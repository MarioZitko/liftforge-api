---
name: add-dto
description: Use when adding a request/response DTO to a module — triggers like "add a DTO for X", "add validation for the create/update X endpoint". Scaffolds a create/update DTO pair with class-validator, class-transformer, and Swagger decorators following the pattern in exercise/program (not the incomplete client/coach pattern). Do NOT use for a pure read-only response shape with no incoming validation need — those can skip validators but should still get @ApiProperty for Swagger.
---

# Add a create/update DTO pair

Follow [`.claude/docs/02-modules-and-dtos.md`](../docs/02-modules-and-dtos.md)'s DTO conventions.
Copy the shape from `exercise/dto/` or `program/dto/` — **not** `client/dto/` or `coach/dto/`,
which are missing `@ApiProperty()` and use the wrong `PartialType` import (both tracked in
[`.claude/docs/04-refactor-backlog.md`](../docs/04-refactor-backlog.md)).

## Steps

1. `src/modules/<name>/dto/create-<name>.dto.ts` — every field gets a class-validator decorator
   (`@IsString`, `@IsInt`, `@IsOptional`, etc.) **and** `@ApiProperty()`.
2. `src/modules/<name>/dto/update-<name>.dto.ts` — `PartialType(Create<Name>Dto)` imported from
   `@nestjs/swagger` (not `@nestjs/mapped-types`).
3. If a field is a numeric FK arriving over JSON (e.g. `programId`), add `@Type(() => Number)`
   from `class-transformer` so it coerces correctly — see `create-client-program.dto.ts` for the
   one existing correct example.
4. Before adding a new `name` + `description` pair to yet another create-DTO, check whether this
   is the fourth+ module doing the exact same thing (`program`, `training-block`,
   `training-week`, `training` already do) — if so, flag it rather than silently repeating it
   again; a shared base DTO may be worth proposing at that point.

## Template — `create-<name>.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Create<Name>Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  relatedId!: number;
}
```

## Template — `update-<name>.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create<Name>Dto } from './create-<name>.dto';

export class Update<Name>Dto extends PartialType(Create<Name>Dto) {}
```

## Checklist (must all be true)

- [ ] Every field has both a class-validator decorator (or is intentionally unvalidated, e.g. a
  response-only shape) and `@ApiProperty()`/`@ApiPropertyOptional()`.
- [ ] `update-*.dto.ts` uses `PartialType` from `@nestjs/swagger`, not `@nestjs/mapped-types`.
- [ ] Numeric FK fields from JSON bodies have `@Type(() => Number)`.
- [ ] No second DTO file created for a resource that already has one (check both a flat
  `<name>.dto.ts` and a `dto/` folder before adding — `user` module currently has both, which is a
  known bug, not a pattern to repeat).
