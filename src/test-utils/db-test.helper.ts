// Shared fixtures for specs that exercise real DB logic (per docs/03-testing.md: use a real
// database, don't mock Prisma, for anything that touches DB logic). Every created row is tagged
// with a `spec-test-` prefixed email/name and must be cleaned up by the spec that created it.
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from 'generated/prisma';

let counter = 0;

/** A short, unique-enough tag for this process run, used to namespace spec-created rows. */
export function uniqueTag(label: string): string {
  counter += 1;
  return `spec-test-${label}-${Date.now()}-${counter}`;
}

/** Builds a TestingModule with the real PrismaModule (and therefore real DB) wired in. */
export async function createDbTestingModule(
  metadata: Omit<ModuleMetadata, 'imports'> & { imports?: ModuleMetadata['imports'] },
): Promise<TestingModule> {
  return Test.createTestingModule({
    ...metadata,
    imports: [PrismaModule, ...(metadata.imports ?? [])],
  }).compile();
}

/** Creates a User (and, for CLIENT/COACH, its profile row) with a unique email. */
export async function createTestUser(
  prisma: PrismaService,
  role: Role = Role.CLIENT,
  overrides: { name?: string; emailVerified?: boolean } = {},
) {
  const user = await prisma.user.create({
    data: {
      email: `${uniqueTag(role.toLowerCase())}@example.test`,
      password: 'not-a-real-hash',
      role,
      name: overrides.name ?? 'Spec Test User',
      emailVerified: overrides.emailVerified ?? true,
    },
  });

  if (role === Role.CLIENT) {
    await prisma.client.create({ data: { userId: user.id } });
  } else if (role === Role.COACH) {
    await prisma.coach.create({ data: { userId: user.id } });
  }

  return user;
}

/**
 * Cascade-safe cleanup for a user created with `createTestUser`. Guards against `userId` being
 * unset (e.g. a spec's `beforeAll` threw before assigning it) — Prisma treats an `undefined`
 * filter value as "no filter," so an unguarded call here would delete every Client/Coach/User row.
 */
export async function deleteTestUser(prisma: PrismaService, userId: string | undefined) {
  if (!userId) return;
  await prisma.client.deleteMany({ where: { userId } });
  await prisma.coach.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}
