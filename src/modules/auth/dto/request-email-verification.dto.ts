import { IsEmail } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  email!: string;
}
