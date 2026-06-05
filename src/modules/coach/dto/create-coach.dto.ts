import { IsOptional, IsString } from 'class-validator';

export class CreateCoachDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  certification?: string;
}