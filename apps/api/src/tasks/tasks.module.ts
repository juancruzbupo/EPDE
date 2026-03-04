import { Module } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskNotesService } from './task-notes.service';
import { PlanDataModule } from '../maintenance-plans/plan-data.module';

/**
 * TasksModule owns the full task lifecycle: repositories, services, and audit logging.
 * It imports PlanDataModule (not MaintenancePlansModule) to get MaintenancePlansRepository
 * without creating a circular dependency.
 */
@Module({
  imports: [PlanDataModule],
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
