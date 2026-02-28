import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { PropertiesModule } from './properties/properties.module';
import { CategoriesModule } from './categories/categories.module';
import { MaintenancePlansModule } from './maintenance-plans/maintenance-plans.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CategoryTemplatesModule } from './category-templates/category-templates.module';
import { TaskTemplatesModule } from './task-templates/task-templates.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule,
    EventEmitterModule.forRoot(),
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
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ...(process.env.REDIS_URL?.startsWith('rediss://') && {
          tls: { rejectUnauthorized: true },
        }),
      },
    }),
    RedisModule,
    HealthModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    PropertiesModule,
    CategoriesModule,
    MaintenancePlansModule,
    DashboardModule,
    UploadModule,
    BudgetsModule,
    ServiceRequestsModule,
    NotificationsModule,
    SchedulerModule,
    CategoryTemplatesModule,
    TaskTemplatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
