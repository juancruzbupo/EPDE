import { Module, forwardRef } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskNotesService } from './task-notes.service';
import { MaintenancePlansModule } from '../maintenance-plans/maintenance-plans.module';

/**
 * TasksModule owns the full task lifecycle: repositories, services, and audit logging.
 * It imports MaintenancePlansModule (via forwardRef to break circular dependency) because
 * TaskLifecycleService needs MaintenancePlansRepository for plan existence and property
 * ownership verification.
 *
 * MaintenancePlansModule imports TasksModule to access TaskLifecycleService and TaskNotesService.
 * MaintenancePlansModule exports MaintenancePlansRepository so a single instance is shared.
 */
@Module({
  imports: [forwardRef(() => MaintenancePlansModule)],
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
