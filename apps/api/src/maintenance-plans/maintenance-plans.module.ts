import { Module } from '@nestjs/common';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksModule } from '../tasks/tasks.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TasksModule],
  controllers: [MaintenancePlansController],
  providers: [MaintenancePlansService, MaintenancePlansRepository, PrismaService],
  exports: [MaintenancePlansService],
})
export class MaintenancePlansModule {}
