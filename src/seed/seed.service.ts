import { Injectable } from '@nestjs/common';
import { seedSuperusers } from './data/superusers.seed';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    await seedSuperusers(this.prisma);
  }
}
