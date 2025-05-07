import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccountController } from './modules/account/account.controller';
import { AccountService } from './modules/account/account.service';
import { SessionController } from './modules/session/session.controller';
import { SessionService } from './modules/session/session.service';
import { VerificationTokenController } from './modules/verification-token/verification-token.controller';
import { VerificationTokenService } from './modules/verification-token/verification-token.service';
import { PasswordResetTokenService } from './modules/password-reset-token/password-reset-token.service';

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
  controllers: [AppController, AccountController, SessionController, VerificationTokenController],
  providers: [AppService, AccountService, SessionService, VerificationTokenService, PasswordResetTokenService],
})
export class AppModule { }
