import type {
  CreateTaskTemplateInput,
  ReorderTemplatesInput,
  UpdateTaskTemplateInput,
} from '@epde/shared';
import {
  createTaskTemplateSchema,
  reorderTemplatesSchema,
  updateTaskTemplateSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TaskTemplatesService } from './task-templates.service';

/**
 * Empty @Controller() prefix is intentional — routes span two resource paths:
 * `category-templates/:categoryId/tasks` (POST, PATCH reorder) and
 * `task-templates/:id` (PATCH, DELETE). A single prefix would be incorrect.
 */
@ApiTags('Plantillas de Tareas')
@ApiBearerAuth()
@Controller()
export class TaskTemplatesController {
  constructor(private readonly service: TaskTemplatesService) {}

  @Post('category-templates/:categoryId/tasks')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(createTaskTemplateSchema)) dto: CreateTaskTemplateInput,
  ) {
    const data = await this.service.create(categoryId, dto);
    return { data, message: 'Tarea template creada' };
  }

  @Patch('task-templates/:id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTaskTemplateSchema)) dto: UpdateTaskTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Plantilla de tarea actualizada' };
  }

  @Delete('task-templates/:id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: null, message: 'Tarea template eliminada' };
  }

  @Patch('category-templates/:categoryId/tasks/reorder')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async reorder(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body(new ZodValidationPipe(reorderTemplatesSchema)) dto: ReorderTemplatesInput,
  ) {
    await this.service.reorder(categoryId, dto.ids);
    return { data: null, message: 'Orden actualizado' };
  }
}
