import { Module } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';

/**
 * Provides MaintenancePlansRepository without service dependencies.
 * Both TasksModule and MaintenancePlansModule import this to avoid a forwardRef cycle.
 */
@Module({
  providers: [MaintenancePlansRepository],
  exports: [MaintenancePlansRepository],
})
export class PlanDataModule {}
