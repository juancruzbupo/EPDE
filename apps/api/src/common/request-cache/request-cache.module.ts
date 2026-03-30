import { Global, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestCacheService } from './request-cache.service';

@Global()
@Module({
  providers: [RequestCacheService],
  exports: [RequestCacheService],
})
export class RequestCacheModule implements NestModule {
  constructor(private readonly cache: RequestCacheService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, _res: Response, next: NextFunction) => {
        this.cache.run(() => next());
      })
      .forRoutes('*');
  }
}
