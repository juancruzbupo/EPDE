import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BudgetsModule } from '../budgets/budgets.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { TasksModule } from '../tasks/tasks.module';
import { BudgetExpirationService } from './budget-expiration.service';
import { ISVSnapshotService } from './isv-snapshot.service';
import { ServiceRequestAutoCloseService } from './service-request-auto-close.service';
import { TaskReminderService } from './task-reminder.service';
import { TaskSafetyService } from './task-safety.service';
import { TaskStatusService } from './task-status.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    EmailModule,
    TasksModule,
    BudgetsModule,
    ServiceRequestsModule,
    DashboardModule,
  ],
  providers: [
    TaskStatusService,
    TaskReminderService,
    TaskSafetyService,
    BudgetExpirationService,
    ServiceRequestAutoCloseService,
    ISVSnapshotService,
  ],
})
export class SchedulerModule {}
