import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { baseEntityExtension } from './extensions/base-entity.extension';
import { ExtendedPrismaClient } from './extendedPrismaClient';

@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
    this.getUserIdFromContext = () => this.cls.get('userId') ?? null;

    const extended = baseEntityExtension(this) as ExtendedPrismaClient;
    Object.assign(this, extended);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
