import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    // ✅ Add ConfigModule globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ Core application modules
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // 60-second window
          limit: 10, // allow max 10 requests per IP
        },
      ],
      errorMessage: 'Too many requests. Please try again later.',
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
