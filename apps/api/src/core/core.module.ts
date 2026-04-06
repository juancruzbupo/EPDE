import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

import { RequestCacheModule } from '../common/request-cache/request-cache.module';
import { ConfigModule } from '../config/config.module';
import { HealthModule } from '../health/health.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 10 },
          { name: 'medium', ttl: 10000, limit: 60 },
          { name: 'long', ttl: 60000, limit: 300 },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
            maxRetriesPerRequest: 5,
            enableOfflineQueue: false,
          }),
        ),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
          ],
          remove: true,
        },
        autoLogging: {
          ignore: (req: IncomingMessage) => req.url === '/api/v1/health',
        },
        genReqId: (req: IncomingMessage) => (req.headers['x-request-id'] as string) ?? randomUUID(),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const parsed = new URL(redisUrl);
        const useTls = parsed.protocol === 'rediss:';

        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
            username: parsed.username !== 'default' ? parsed.username : undefined,
            maxRetriesPerRequest: null,
            ...(useTls && {
              tls: { rejectUnauthorized: true },
            }),
          },
        };
      },
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    MetricsModule,
    RequestCacheModule,
  ],
  // @Global() on this module makes ONLY the exports below available to all modules.
  // The other imported modules work as follows:
  // - SentryModule, ThrottlerModule, LoggerModule, BullModule → self-registered as global
  // - HealthModule, MetricsModule, RequestCacheModule → only used within CoreModule scope
  // Do NOT add feature modules here — use AppModule.imports for those.
  exports: [ConfigModule, PrismaModule, RedisModule],
})
export class CoreModule {}
