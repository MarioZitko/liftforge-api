import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule } from '@nestjs/throttler';
import { ClsUserMiddleware } from './middleware/cls-user.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { CoachModule } from './modules/coach/coach.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { ClientProgramController } from './modules/client-program/client-program.controller';
import { ClientProgramService } from './modules/client-program/client-program.service';
import { ProgramController } from './modules/program/program.controller';
import { ProgramService } from './modules/program/program.service';
import { TrainingBlockController } from './modules/training-block/training-block.controller';
import { TrainingBlockService } from './modules/training-block/training-block.service';
import { TrainingExerciseController } from './modules/training-exercise/training-exercise.controller';
import { TrainingExerciseService } from './modules/training-exercise/training-exercise.service';
import { TrainingWeekController } from './modules/training-week/training-week.controller';
import { TrainingWeekService } from './modules/training-week/training-week.service';
import { TrainingController } from './modules/training/training.controller';
import { TrainingService } from './modules/training/training.service';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
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

  controllers: [
    AppController,
    ProgramController,
    ClientProgramController,
    TrainingController,
    TrainingBlockController,
    TrainingWeekController,
    TrainingExerciseController,
  ],
  providers: [
    AppService,
    ProgramService,
    ClientProgramService,
    TrainingService,
    TrainingBlockService,
    TrainingWeekService,
    TrainingExerciseService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClsUserMiddleware).forRoutes('*'); // ✅ apply the middleware globally
  }
}
