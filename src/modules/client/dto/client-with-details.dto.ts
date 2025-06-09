import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UserDetailsDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiProperty()
  @IsString()
  email!: string;
}

export class ClientWithDetailsDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date | null;

  @ApiProperty()
  @IsBoolean()
  lookingForCoach!: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  coachId?: string | null;

  @ApiProperty({ type: UserDetailsDto })
  user!: UserDetailsDto;
}
