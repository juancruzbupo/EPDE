import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoryTemplatesModule } from './category-templates/category-templates.module';
import { ClientsModule } from './clients/clients.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { CoreModule } from './core/core.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InspectionsModule } from './inspections/inspections.module';
import { LandingSettingsModule } from './landing-settings/landing-settings.module';
import { MaintenancePlansModule } from './maintenance-plans/maintenance-plans.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { NotificationsModule } from './notifications/notifications.module';
import { PropertiesModule } from './properties/properties.module';
import { QuoteTemplatesModule } from './quote-templates/quote-templates.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { TaskTemplatesModule } from './task-templates/task-templates.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    PropertiesModule,
    CategoriesModule,
    MaintenancePlansModule,
    DashboardModule,
    LandingSettingsModule,
    UploadModule,
    BudgetsModule,
    ServiceRequestsModule,
    NotificationsModule,
    SchedulerModule,
    CategoryTemplatesModule,
    TaskTemplatesModule,
    QuoteTemplatesModule,
    InspectionsModule,
    ReferralsModule,
  ],
  controllers: [],
  providers: [
    // Guard execution order (critical — order matters for security):
    // 1. ThrottlerGuard — rate-limits before any auth work (blocks bots/brute-force)
    // 2. JwtAuthGuard  — validates JWT, populates req.user (@Public skips)
    // 3. RolesGuard    — checks @Roles() decorator, default-deny if missing
    // 4. SubscriptionGuard — checks subscriptionExpiresAt for CLIENTs (402 if expired)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
