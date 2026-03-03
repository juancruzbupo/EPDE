import { Module, forwardRef } from '@nestjs/common';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [MaintenancePlansController],
  providers: [MaintenancePlansService, MaintenancePlansRepository],
  exports: [MaintenancePlansService, MaintenancePlansRepository],
})
export class MaintenancePlansModule {}
