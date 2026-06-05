import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTrainingExerciseDto {
  @ApiProperty()
  @IsInt()
  trainingId!: number;

  @ApiProperty()
  @IsInt()
  exerciseId!: number;

  @ApiProperty()
  @IsInt()
  sortOrder!: number;

  @ApiProperty()
  @IsInt()
  sets!: number;

  @ApiProperty()
  @IsInt()
  reps!: number;

  @ApiProperty()
  @IsNumber()
  weight!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rpePlanned?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rpeActual?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  intensity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  percentageOfMax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}
