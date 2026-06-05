import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrainingWeekDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  number!: number;

  @ApiProperty()
  @IsInt()
  blockId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
