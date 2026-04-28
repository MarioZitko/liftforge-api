import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderTrainingExercisesDto {
  @ApiProperty()
  @IsInt()
  trainingId!: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  orderedIds!: number[];
}
