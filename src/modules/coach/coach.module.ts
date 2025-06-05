import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [EmailModule, PrismaModule],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
