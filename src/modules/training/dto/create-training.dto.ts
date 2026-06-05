import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrainingDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsInt()
  weekId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
