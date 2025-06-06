import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteClientDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
