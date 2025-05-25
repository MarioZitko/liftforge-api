// src/modules/exercise/dto/create-exercise.dto.ts
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  tutorialUrl?: string;
}
