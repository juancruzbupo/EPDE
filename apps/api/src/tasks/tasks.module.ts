import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CategoryTemplatesModule } from '../category-templates/category-templates.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PlanDataModule } from '../maintenance-plans/plan-data.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { TaskNotesService } from './task-notes.service';
import { TasksRepository } from './tasks.repository';

/**
 * TasksModule owns the full task lifecycle: repositories, services, and audit logging.
 *
 * ## Why PlanDataModule instead of MaintenancePlansModule?
 * MaintenancePlansModule imports TasksModule (to access TasksRepository for plan
 * activation). If TasksModule imported MaintenancePlansModule back, we'd have a
 * circular dependency. PlanDataModule is a thin re-export of just
 * MaintenancePlansRepository, with no import of TasksModule, breaking the cycle.
 * See docs/adr/007-plan-data-module-circular-dep.md.
 *
 * ## Why TaskAuditLogRepository is NOT exported
 * TaskAuditLogRepository is only used internally by TaskLifecycleService.
 * No other module needs it — unlike BudgetAuditLogRepository, which is used
 * by SchedulerModule (budget-expiration.service.ts) and is therefore exported
 * from BudgetsModule.
 */
@Module({
  imports: [
    PlanDataModule,
    CategoryTemplatesModule,
    NotificationsModule,
    AuthModule,
    DashboardModule,
  ],
  providers: [
    TasksRepository,
    TaskLogsRepository,
    TaskNotesRepository,
    TaskAuditLogRepository,
    TaskLifecycleService,
    TaskNotesService,
  ],
  exports: [TaskLifecycleService, TaskNotesService, TasksRepository],
})
export class TasksModule {}
