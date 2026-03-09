import { Module } from '@nestjs/common';

import { TasksModule } from '../tasks/tasks.module';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { MaintenancePlansService } from './maintenance-plans.service';
import { PlanDataModule } from './plan-data.module';

@Module({
  imports: [PlanDataModule, TasksModule],
  controllers: [MaintenancePlansController],
  providers: [MaintenancePlansService],
  exports: [MaintenancePlansService, PlanDataModule],
})
export class MaintenancePlansModule {}
