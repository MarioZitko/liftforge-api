import { Role } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export async function seedSuperusers(prisma: PrismaService) {
  const users = [
    {
      email: 'admin@liftforge.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN, // ✅ use the enum value here
      emailVerified: true,
    },
    {
      email: 'coach@liftforge.com',
      name: 'Coach',
      password: await bcrypt.hash('coach123', 10),
      role: Role.COACH, // ✅ also enum
      emailVerified: true,
    },
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } });
    if (!exists) {
      await prisma.user.create({ data: user });
    }
  }
}
