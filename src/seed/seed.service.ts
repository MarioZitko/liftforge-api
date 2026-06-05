import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seedClients } from './data/clients.seed';
import { seedCoaches } from './data/coaches.seed';
import { seedExercises } from './data/seed.exercises';
import { seedSuperusers } from './data/superusers.seed';
import { seedValidData } from './data/valid-data.seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async run() {
    this.logger.log('🔐 Seeding superusers...');
    await seedSuperusers(this.prisma);
    this.logger.log('✅ Superusers seeded.');

    this.logger.log('🏋️ Seeding exercises...');
    await seedExercises(this.prisma);
    this.logger.log('✅ Exercises seeded.');

    this.logger.log('🏋️ Seeding coaches...');
    await seedCoaches(this.prisma);
    this.logger.log('✅ Coaches seeded.');

    this.logger.log('🏋️ Seeding clients...');
    await seedClients(this.prisma);
    this.logger.log('✅ Clients seeded.');

    this.logger.log('🏋️ Seeding valid data...');
    await seedValidData(this.prisma);
    this.logger.log('✅ Valid data seeded.');

    this.logger.log('🎉 Seeding completed successfully!');
  }
}
