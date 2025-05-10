import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailVerificationDto {
  @ApiProperty({ description: 'The email address to verify' })
  @IsEmail()
  email!: string;
}
