import * as bcrypt from 'bcrypt';
import { Role } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

export async function seedClients(prisma: PrismaService) {
  const surnames = [
    'Kovačić',
    'Blažanović',
    'Petrović',
    'Jurić',
    'Marinović',
    'Šarić',
    'Tomić',
    'Vuković',
  ];
  const names = ['Ivan', 'Dario', 'Ana', 'Luka', 'Petra', 'Marko', 'Sara', 'Tomislav', 'Bruno'];

  for (const surname of surnames) {
    for (const name of names) {
      const email = `${surname.toLowerCase()}.${name.toLowerCase()}@liftforge.com`;
      const password = await bcrypt.hash('password123', 10);
      const userData = {
        email,
        name: `${name} ${surname}`,
        password,
        role: Role.CLIENT,
        emailVerified: true,
      };

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
}
