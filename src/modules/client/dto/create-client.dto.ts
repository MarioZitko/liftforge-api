import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}