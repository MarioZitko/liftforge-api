import { Injectable, Logger } from '@nestjs/common';
import { seedSuperusers } from './data/superusers.seed';
import { seedExercises } from './data/seed.exercises';
import { PrismaService } from '../prisma/prisma.service';

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
  }
}
