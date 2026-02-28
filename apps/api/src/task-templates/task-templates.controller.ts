import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { TaskTemplatesService } from './task-templates.service';
import {
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
  reorderTemplatesSchema,
  UserRole,
} from '@epde/shared';
import type {
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  ReorderTemplatesInput,
} from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Task Templates')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller()
export class TaskTemplatesController {
  constructor(private readonly service: TaskTemplatesService) {}

  @Post('category-templates/:categoryId/tasks')
  async create(
    @Param('categoryId') categoryId: string,
    @Body(new ZodValidationPipe(createTaskTemplateSchema)) dto: CreateTaskTemplateInput,
  ) {
    const data = await this.service.create(categoryId, dto);
    return { data, message: 'Tarea template creada' };
  }

  @Patch('task-templates/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskTemplateSchema)) dto: UpdateTaskTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data };
  }

  @Delete('task-templates/:id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('category-templates/:categoryId/tasks/reorder')
  async reorder(
    @Param('categoryId') categoryId: string,
    @Body(new ZodValidationPipe(reorderTemplatesSchema)) dto: ReorderTemplatesInput,
  ) {
    return this.service.reorder(categoryId, dto.ids);
  }
}
