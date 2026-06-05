// src/modules/exercise/dto/update-exercise.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}
