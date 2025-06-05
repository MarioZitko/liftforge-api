import { Role } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export async function seedSuperusers(prisma: PrismaService) {
  const usersData = [
    {
      email: 'admin@liftforge.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      emailVerified: true,
    },
    {
      email: 'coach@liftforge.com',
      name: 'Coach',
      password: await bcrypt.hash('coach123', 10),
      role: Role.COACH,
      emailVerified: true,
    },
  ];

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });

    if (user.role === Role.COACH) {
      const coach = await prisma.coach.findUnique({
        where: { userId: user.id },
      });
      if (!coach) {
        await prisma.coach.create({
          data: {
            userId: user.id,
          },
        });
      }
    }
  }
}
