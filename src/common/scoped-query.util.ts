import { PrismaService } from '@/prisma/prisma.service';

/**
 * Resolves the `Coach` profile id for a given `User.id`, or `null` if the user has no coach
 * profile. Used anywhere a service needs to scope a query to "resources belonging to this
 * coach" starting from a JWT `userId`.
 */
export async function resolveCoachId(
  prisma: PrismaService,
  userId: string,
): Promise<string | null> {
  const coach = await prisma.coach.findUnique({ where: { userId }, select: { id: true } });
  return coach?.id ?? null;
}

/**
 * Resolves the `Client` profile id for a given `User.id`, or `null` if the user has no client
 * profile. Used anywhere a service needs to scope a query to "resources belonging to this
 * client" starting from a JWT `userId`.
 */
export async function resolveClientId(
  prisma: PrismaService,
  userId: string,
): Promise<string | null> {
  const client = await prisma.client.findUnique({ where: { userId }, select: { id: true } });
  return client?.id ?? null;
}

type OnlyMineFilter =
  | { createdById: string }
  | { OR: [{ createdById: null }, { createdById: string }] };

/**
 * Builds the "onlyMine" Prisma where-clause shared by resources that are either global (no
 * creator) or owned by a specific coach: `onlyMine` restricts to the coach's own records,
 * otherwise both global and the coach's own records are included.
 */
export function buildOnlyMineFilter(userId: string, onlyMine: boolean): OnlyMineFilter {
  return onlyMine
    ? { createdById: userId }
    : { OR: [{ createdById: null }, { createdById: userId }] };
}
