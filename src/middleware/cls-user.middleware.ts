// src/middleware/cls-user.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ClsUserMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;

    if (user?.userId) {
      this.cls.set('userId', user.userId);
    }

    next();
  }
}
