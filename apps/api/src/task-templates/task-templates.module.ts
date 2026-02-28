import { Module } from '@nestjs/common';
import { TaskTemplatesController } from './task-templates.controller';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesRepository } from './task-templates.repository';
import { CategoryTemplatesModule } from '../category-templates/category-templates.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [CategoryTemplatesModule],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService, TaskTemplatesRepository, PrismaService],
  exports: [TaskTemplatesService],
})
export class TaskTemplatesModule {}
