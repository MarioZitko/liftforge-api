import { IsUUID, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The token to reset password' })
  @IsUUID()
  token!: string;

  @ApiProperty({ description: 'The new password' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
