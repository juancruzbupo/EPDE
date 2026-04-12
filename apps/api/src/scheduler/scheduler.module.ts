import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth/auth.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { AnniversaryService } from './anniversary.service';
import { BudgetExpirationService } from './budget-expiration.service';
import { DataCleanupRepository } from './data-cleanup.repository';
import { DataCleanupService } from './data-cleanup.service';
import { ISVSnapshotService } from './isv-snapshot.service';
import { NotificationCleanupService } from './notification-cleanup.service';
import { ServiceRequestAutoCloseService } from './service-request-auto-close.service';
import { SubscriptionReminderService } from './subscription-reminder.service';
import { TaskReminderService } from './task-reminder.service';
import { TaskSafetyService } from './task-safety.service';
import { TaskStatusService } from './task-status.service';
import { WeeklyChallengeRepository } from './weekly-challenge.repository';
import { WeeklyChallengeService } from './weekly-challenge.service';
import { WeeklySummaryService } from './weekly-summary.service';

/**
 * SchedulerModule — HOT ZONE for PRs.
 *
 * Imports 7 feature modules to run cron jobs across all domains.
 * Any change to BudgetsModule, ServiceRequestsModule, TasksModule,
 * PropertiesModule, NotificationsModule, EmailModule, or DashboardModule
 * can affect scheduler behavior.
 *
 * **PR rule:** Changes to any imported module MUST include E2E verification
 * that cron jobs still execute correctly (check scheduler spec files).
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    EmailModule,
    TasksModule,
    BudgetsModule,
    ServiceRequestsModule,
    DashboardModule,
    PropertiesModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    TaskStatusService,
    TaskReminderService,
    TaskSafetyService,
    BudgetExpirationService,
    ServiceRequestAutoCloseService,
    ISVSnapshotService,
    NotificationCleanupService,
    SubscriptionReminderService,
    DataCleanupService,
    DataCleanupRepository,
    WeeklySummaryService,
    AnniversaryService,
    WeeklyChallengeRepository,
    WeeklyChallengeService,
  ],
  exports: [WeeklyChallengeService],
})
export class SchedulerModule {}
