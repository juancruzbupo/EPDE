import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { SentryModule } from '@sentry/nestjs/setup';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 60 },
    ]),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
