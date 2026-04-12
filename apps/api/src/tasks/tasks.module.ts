import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CategoryTemplatesModule } from '../category-templates/category-templates.module';
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
 * It imports PlanDataModule (not MaintenancePlansModule) to get MaintenancePlansRepository
 * without creating a circular dependency.
 */
@Module({
  imports: [PlanDataModule, CategoryTemplatesModule, NotificationsModule, AuthModule],
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
