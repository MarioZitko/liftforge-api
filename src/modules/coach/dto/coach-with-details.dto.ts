import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UserDetailsDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  email!: string;
}

class CoachClientCountDto {
  @ApiProperty()
  @IsInt()
  clients!: number;
}

export class CoachWithDetailsDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  certification?: string | null;

  @ApiProperty()
  lookingForClients!: boolean;

  @ApiProperty({ type: UserDetailsDto })
  user!: UserDetailsDto;

  @ApiProperty({ type: CoachClientCountDto })
  _count!: CoachClientCountDto;
}
