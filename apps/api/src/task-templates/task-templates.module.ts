import { Module } from '@nestjs/common';

import { CategoryTemplatesModule } from '../category-templates/category-templates.module';
import { TaskTemplatesController } from './task-templates.controller';
import { TaskTemplatesRepository } from './task-templates.repository';
import { TaskTemplatesService } from './task-templates.service';

@Module({
  imports: [CategoryTemplatesModule],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService, TaskTemplatesRepository],
  exports: [TaskTemplatesService],
})
export class TaskTemplatesModule {}
