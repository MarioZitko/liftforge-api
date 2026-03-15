import { Module } from '@nestjs/common';
import { ClientProgramController } from './client-program.controller';
import { ClientProgramService } from './client-program.service';

@Module({
  controllers: [ClientProgramController],
  providers: [ClientProgramService],
})
export class ClientProgramsModule {}
