import { Module } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskNotesService } from './task-notes.service';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { PrismaService } from '../prisma/prisma.service';

/**
 * TasksModule owns the full task lifecycle: repositories, services, and audit logging.
 * It imports MaintenancePlansRepository (from maintenance-plans/) because TaskLifecycleService
 * needs to verify plan existence and property ownership for authorization checks.
 * MaintenancePlansModule imports this module to access TaskLifecycleService and TaskNotesService.
 *
 * Note: MaintenancePlansRepository is also provided by MaintenancePlansModule — dual instantiation
 * is safe because the repository is stateless (all state lives in PrismaService). Using forwardRef
 * to share a single instance was considered but adds coupling risk for no functional benefit.
 */
@Module({
  providers: [
    TasksRepository,
    TaskLogsRepository,
    TaskNotesRepository,
    TaskAuditLogRepository,
    TaskLifecycleService,
    TaskNotesService,
    MaintenancePlansRepository,
    PrismaService,
  ],
  exports: [TaskLifecycleService, TaskNotesService, TasksRepository],
})
export class TasksModule {}
