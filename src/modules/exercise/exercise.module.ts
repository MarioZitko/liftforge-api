import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';

@Module({
  providers: [ExerciseService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
