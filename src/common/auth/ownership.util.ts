import { PrismaService } from '@/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Role } from 'generated/prisma';

export interface RequestingUser {
  userId: string;
  role: string;
}

interface ProgramAccessContext {
  /** The owning `Program.id` for the resource being checked, or `null` if the resource is not
   * (yet) linked to a program — e.g. an orphaned `TrainingBlock`. */
  programId: number | null;
  /** Used only when `programId` is `null`: the resource's own `createdById`, so a coach can still
   * act on a resource they created before it was ever attached to a program. */
  fallbackCreatedById?: string | null;
}

/**
 * Verifies `user` may access a resource that belongs (directly or via its parent chain) to a
 * `Program`. A coach owns it iff they created the `Program`; a client owns it iff the `Program`
 * is assigned to them via a `ClientProgram`; admins bypass the check entirely.
 * Throws `ForbiddenException` otherwise.
 */
export async function assertProgramAccess(
  prisma: PrismaService,
  ctx: ProgramAccessContext,
  user: RequestingUser,
): Promise<void> {
  if (user.role === Role.ADMIN) return;

  if (ctx.programId !== null) {
    if (user.role === Role.COACH) {
      const program = await prisma.program.findUnique({
        where: { id: ctx.programId },
        select: { createdById: true },
      });
      if (program?.createdById === user.userId) return;
    } else if (user.role === Role.CLIENT) {
      const assignment = await prisma.clientProgram.findFirst({
        where: { programId: ctx.programId, client: { userId: user.userId } },
        select: { id: true },
      });
      if (assignment) return;
    }
  } else if (user.role === Role.COACH && ctx.fallbackCreatedById === user.userId) {
    return;
  }

  throw new ForbiddenException('You do not have access to this resource.');
}

/**
 * Guards against reparenting a resource (e.g. a `TrainingBlock`'s `programId`) to a different
 * parent via an update DTO. Ownership checks elsewhere in this file only validate the resource's
 * *current* parent chain — without this, a non-admin owner could move a resource they own into a
 * parent (program, block, week, training, client, coach) they don't. Only admins may reparent.
 */
export function assertNoReparenting(
  fieldName: string,
  newValue: unknown,
  currentValue: unknown,
  user: RequestingUser,
): void {
  if (user.role === Role.ADMIN) return;
  if (newValue !== undefined && newValue !== currentValue) {
    throw new ForbiddenException(`Only an admin can change ${fieldName}.`);
  }
}

/**
 * Verifies `user` may access a `ClientProgram`. A coach owns it iff they're its assigned coach; a
 * client owns it iff they're its assigned client; admins bypass the check entirely.
 * Throws `ForbiddenException` otherwise.
 */
export async function assertClientProgramAccess(
  prisma: PrismaService,
  clientProgram: { coachId: string | null; clientId: string },
  user: RequestingUser,
): Promise<void> {
  if (user.role === Role.ADMIN) return;

  if (user.role === Role.COACH && clientProgram.coachId) {
    const coach = await prisma.coach.findUnique({
      where: { id: clientProgram.coachId },
      select: { userId: true },
    });
    if (coach?.userId === user.userId) return;
  } else if (user.role === Role.CLIENT) {
    const client = await prisma.client.findUnique({
      where: { id: clientProgram.clientId },
      select: { userId: true },
    });
    if (client?.userId === user.userId) return;
  }

  throw new ForbiddenException('You do not have access to this resource.');
}
