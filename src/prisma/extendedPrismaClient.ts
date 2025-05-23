import { PrismaClient } from '../../generated/prisma';

export class ExtendedPrismaClient extends PrismaClient {
  getUserIdFromContext: (() => string | null) | undefined;
}
