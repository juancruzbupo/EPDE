import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { RedisModule } from '../redis/redis.module';
import { HealthModule } from '../health/health.module';
import { MetricsModule } from '../metrics/metrics.module';

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
        return {
          connection: {
            url: redisUrl,
            ...(redisUrl.startsWith('rediss://') && {
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
  exports: [ConfigModule, PrismaModule, RedisModule],
})
export class CoreModule {}
