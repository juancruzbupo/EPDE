import { Module } from '@nestjs/common';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MaintenancePlansController],
  providers: [MaintenancePlansService, MaintenancePlansRepository, TasksRepository, PrismaService],
  exports: [MaintenancePlansService],
})
export class MaintenancePlansModule {}
