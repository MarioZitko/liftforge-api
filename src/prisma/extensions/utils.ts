export interface PrismaHookParams {
  model: any; // Replace `any` with your actual model type if possible
  args: any; // Replace with real args type
  query: any; // This is often a Prisma middleware `next` function
}
