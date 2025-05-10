import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'generated/prisma';

export class RegisterDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: Role, required: false, default: Role.CLIENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
