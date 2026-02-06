import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateClientProgramDto {
  @ApiProperty()
  @IsString()
  clientId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  programId!: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty()
  @IsString()
  @IsIn(['active', 'completed', 'draft'])
  status!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coachId?: string;
}
