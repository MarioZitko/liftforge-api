import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, Max, Min } from 'class-validator';

export class ScheduleProgramDto {
  @ApiProperty()
  @IsInt()
  programId!: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ type: [Number], description: 'Day-of-week indices to train on (0=Sun, 1=Mon, ..., 6=Sat)' })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  trainingDays!: number[];
}
