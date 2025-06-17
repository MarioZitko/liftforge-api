import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'generated/prisma';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

export class PaginatedUserDto {
  id!: string;
  email!: string;
  name!: string | null;
  role!: Role;
  emailVerified!: boolean;
  createdAt!: Date;
}
