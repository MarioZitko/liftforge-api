import { PrismaClient } from '@prisma/client';

export class ExtendedPrismaClient extends PrismaClient {
  getUserIdFromContext: (() => string | null) | undefined;
}
