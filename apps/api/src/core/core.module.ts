import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { LoggerModule } from 'nestjs-pino';

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
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10000, limit: 30 },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
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
  ],
  // Only ConfigModule, PrismaModule, and RedisModule are exported here.
  // ThrottlerModule, BullModule, LoggerModule, SentryModule, HealthModule,
  // and MetricsModule are available globally via their own @Global() decorators
  // or internal NestJS module registration.
  exports: [ConfigModule, PrismaModule, RedisModule],
})
export class CoreModule {}
