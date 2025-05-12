import { ExtendedPrismaClient } from '../extendedPrismaClient';

export const baseEntityExtension = (prisma: ExtendedPrismaClient) =>
  prisma.$extends({
    name: 'BaseEntityAuditing',
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const userId = prisma.getUserIdFromContext?.();
          if (!userId) return query(args);

          if ('createdById' in args.data) {
            args.data.createdById = userId;
          }
          if ('updatedById' in args.data) {
            args.data.updatedById = userId;
          }

          return query(args);
        },

        async update({ model, args, query }) {
          const userId = prisma.getUserIdFromContext?.();
          if (!userId) return query(args);

          if ('updatedById' in args.data) {
            args.data.updatedById = userId;
          }

          return query(args);
        },
      },
    },
  });
