import { Module } from '@nestjs/common';

import { MaintenancePlansRepository } from './maintenance-plans.repository';

/**
 * Provides MaintenancePlansRepository without service dependencies.
 *
 * WHY this exists: MaintenancePlansModule needs TasksModule (for task CRUD),
 * and TasksModule needs MaintenancePlansRepository (for plan ownership checks).
 * Importing MaintenancePlansModule from TasksModule would create a circular dependency.
 * PlanDataModule breaks the cycle by exporting ONLY the repository — no service, no controller.
 *
 * WHO imports this: TasksModule, MaintenancePlansModule, SchedulerModule.
 * If you need MaintenancePlansRepository, import PlanDataModule — NOT MaintenancePlansModule.
 */
@Module({
  providers: [MaintenancePlansRepository],
  exports: [MaintenancePlansRepository],
})
export class PlanDataModule {}
