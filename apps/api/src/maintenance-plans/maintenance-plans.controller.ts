import { Controller, Get, Post, Patch, Delete, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MaintenancePlansService } from './maintenance-plans.service';
import {
  updatePlanSchema,
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
  completeTaskSchema,
  createTaskNoteSchema,
  UserRole,
} from '@epde/shared';
import type {
  UpdatePlanInput,
  UpdateTaskInput,
  ReorderTasksInput,
  CompleteTaskInput,
  CreateTaskNoteInput,
} from '@epde/shared';
import type { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createTaskBodySchema = createTaskSchema.omit({ maintenancePlanId: true });
type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

@ApiTags('Planes de Mantenimiento')
@ApiBearerAuth()
@Controller('maintenance-plans')
export class MaintenancePlansController {
  constructor(private readonly plansService: MaintenancePlansService) {}

  @Get(':id')
  async getPlan(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    const data = await this.plansService.getPlan(id, user);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updatePlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePlanSchema)) dto: UpdatePlanInput,
  ) {
    const data = await this.plansService.updatePlan(id, dto);
    return { data };
  }

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN)
  async addTask(
    @Param('id') planId: string,
    @Body(new ZodValidationPipe(createTaskBodySchema)) dto: CreateTaskBody,
  ) {
    const data = await this.plansService.addTask(planId, dto);
    return { data, message: 'Tarea agregada' };
  }

  @Patch(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  async updateTask(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskInput,
  ) {
    const data = await this.plansService.updateTask(taskId, dto);
    return { data };
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  async removeTask(@Param('taskId') taskId: string) {
    return this.plansService.removeTask(taskId);
  }

  @Put(':id/tasks/reorder')
  @Roles(UserRole.ADMIN)
  async reorderTasks(
    @Param('id') planId: string,
    @Body(new ZodValidationPipe(reorderTasksSchema)) dto: ReorderTasksInput,
  ) {
    const data = await this.plansService.reorderTasks(planId, dto);
    return { data };
  }

  @Get(':id/tasks/:taskId')
  async getTaskDetail(@Param('taskId') taskId: string) {
    const data = await this.plansService.getTaskDetail(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/complete')
  async completeTask(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(completeTaskSchema)) dto: CompleteTaskInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.plansService.completeTask(taskId, user.id, dto);
    return { data, message: 'Tarea completada' };
  }

  @Get(':id/tasks/:taskId/logs')
  async getTaskLogs(@Param('taskId') taskId: string) {
    const data = await this.plansService.getTaskLogs(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/notes')
  async addTaskNote(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(createTaskNoteSchema)) dto: CreateTaskNoteInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.plansService.addTaskNote(taskId, user.id, dto);
    return { data, message: 'Nota agregada' };
  }

  @Get(':id/tasks/:taskId/notes')
  async getTaskNotes(@Param('taskId') taskId: string) {
    const data = await this.plansService.getTaskNotes(taskId);
    return { data };
  }
}
