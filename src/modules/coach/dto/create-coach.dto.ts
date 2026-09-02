import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCoachDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  certification?: string;
}
