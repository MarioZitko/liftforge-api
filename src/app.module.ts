import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './modules/user/user.module';
import { ClientModule } from './modules/client/client.module';
import { CoachModule } from './modules/coach/coach.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { ClsUserMiddleware } from './middleware/cls-user.middleware';
@Module({
  imports: [
    // ✅ Add ClsModule globally
    // This module is used for request-scoped storage, useful for storing user sessions
    ClsModule.forRoot({
      middleware: { mount: true },
    }),

    // ✅ Add ConfigModule globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // ✅ Core application modules
    PrismaModule,
    AuthModule,
    UserModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // 60-second window
          limit: 10, // allow max 10 requests per IP
        },
      ],
      errorMessage: 'Too many requests. Please try again later.',
    }),
    ClientModule,
    CoachModule,
    ExerciseModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClsUserMiddleware).forRoutes('*'); // ✅ apply the middleware globally
  }
}
