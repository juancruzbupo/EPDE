import type {
  BulkAddTasksInput,
  CompleteTaskInput,
  CreateTaskNoteInput,
  CurrentUser as CurrentUserPayload,
  ListTasksQueryInput,
  ReorderTasksInput,
  UpdatePlanInput,
  UpdateTaskInput,
} from '@epde/shared';
import {
  bulkAddTasksSchema,
  completeTaskSchema,
  createTaskNoteSchema,
  createTaskSchema,
  listTasksQuerySchema,
  RecurrenceType,
  reorderTasksSchema,
  updatePlanSchema,
  updateTaskWithRecurrenceSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { z } from 'zod';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TaskLifecycleService } from '../tasks/task-lifecycle.service';
import { TaskNotesService } from '../tasks/task-notes.service';
import { MaintenancePlansService } from './maintenance-plans.service';

const createTaskBodySchema = createTaskSchema
  .omit({ maintenancePlanId: true })
  .superRefine((data, ctx) => {
    if (data.recurrenceType === RecurrenceType.CUSTOM && !data.recurrenceMonths) {
      ctx.addIssue({
        code: 'custom' as const,
        message: 'recurrenceMonths es requerido cuando recurrenceType es CUSTOM',
        path: ['recurrenceMonths'],
      });
    }
  });
type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

@ApiTags('Planes de Mantenimiento')
@ApiBearerAuth()
@Controller('maintenance-plans')
export class MaintenancePlansController {
  constructor(
    private readonly plansService: MaintenancePlansService,
    private readonly taskLifecycle: TaskLifecycleService,
    private readonly taskNotes: TaskNotesService,
  ) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listPlans(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.plansService.listPlans(user);
    return { data };
  }

  @Get('tasks')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listAllTasks(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(listTasksQuerySchema)) query: ListTasksQueryInput,
  ) {
    const userId = user.role === UserRole.CLIENT ? user.id : undefined;
    const data = await this.taskLifecycle.listAllTasks(
      userId,
      query.status,
      query.take,
      query.propertyId,
    );
    return { data };
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPlan(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.plansService.getPlan(id, user);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePlanSchema)) dto: UpdatePlanInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.plansService.updatePlan(id, dto, user.id);
    return { data, message: 'Plan de mantenimiento actualizado' };
  }

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async addTask(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body(new ZodValidationPipe(createTaskBodySchema)) dto: CreateTaskBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.addTask(planId, dto, user.id);
    return { data, message: 'Tarea agregada' };
  }

  /**
   * Incremental bulk-add of tasks from a CategoryTemplate to an existing plan.
   * For INITIAL plan creation, prefer the inspection-driven flow
   * (POST /inspections/:id/generate-plan) — it is condition-aware. This endpoint
   * is for adding a whole category to a plan that already exists (e.g. owner
   * adds a new sector like pool or boiler after the plan was first built).
   */
  @Post(':id/tasks/bulk')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async bulkAddTasks(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body(new ZodValidationPipe(bulkAddTasksSchema)) body: BulkAddTasksInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.taskLifecycle.bulkAddFromTemplate(
      planId,
      body.categoryTemplateId,
      user.id,
    );
    return { data: result, message: `${result.created} tareas agregadas` };
  }

  // Static segment MUST be before :taskId to avoid NestJS matching "reorder" as a UUID
  @Patch(':id/tasks/reorder')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async reorderTasks(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body(new ZodValidationPipe(reorderTasksSchema)) dto: ReorderTasksInput,
  ) {
    const data = await this.taskLifecycle.reorderTasks(planId, dto);
    return { data, message: 'Orden de tareas actualizado' };
  }

  @Patch(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updateTask(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(updateTaskWithRecurrenceSchema)) dto: UpdateTaskInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.updateTask(planId, taskId, dto, user.id);
    return { data, message: 'Tarea actualizada' };
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async removeTask(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    await this.taskLifecycle.removeTask(planId, taskId);
    return { data: null, message: 'Tarea eliminada' };
  }

  @Get(':id/tasks/:taskId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskDetail(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user, planId);
    const data = await this.taskNotes.getTaskDetail(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/complete')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async completeTask(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(completeTaskSchema)) dto: CompleteTaskInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.completeTask(taskId, user.id, dto, user, planId);
    return { data, message: 'Tarea completada' };
  }

  @Get(':id/tasks/:taskId/logs')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskLogs(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user, planId);
    const data = await this.taskNotes.getTaskLogs(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/notes')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async addTaskNote(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(createTaskNoteSchema)) dto: CreateTaskNoteInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user, planId);
    const data = await this.taskNotes.addTaskNote(taskId, user.id, dto);
    return { data, message: 'Nota agregada' };
  }

  @Get(':id/tasks/:taskId/notes')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskNotes(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user, planId);
    const data = await this.taskNotes.getTaskNotes(taskId);
    return { data };
  }
}
