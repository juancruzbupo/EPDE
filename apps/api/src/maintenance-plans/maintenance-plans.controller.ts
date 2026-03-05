import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MaintenancePlansService } from './maintenance-plans.service';
import { TaskLifecycleService } from '../tasks/task-lifecycle.service';
import { TaskNotesService } from '../tasks/task-notes.service';
import {
  updatePlanSchema,
  createTaskSchema,
  updateTaskWithRecurrenceSchema,
  reorderTasksSchema,
  completeTaskSchema,
  createTaskNoteSchema,
  listTasksQuerySchema,
  UserRole,
} from '@epde/shared';
import type {
  UpdatePlanInput,
  UpdateTaskInput,
  ReorderTasksInput,
  CompleteTaskInput,
  CreateTaskNoteInput,
  ListTasksQueryInput,
  CurrentUser as CurrentUserPayload,
} from '@epde/shared';
import type { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createTaskBodySchema = createTaskSchema
  .omit({ maintenancePlanId: true })
  .superRefine((data, ctx) => {
    if (data.recurrenceType === 'CUSTOM' && !data.recurrenceMonths) {
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
    const data = await this.taskLifecycle.listAllTasks(userId, query.status, query.take);
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
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePlanSchema)) dto: UpdatePlanInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.plansService.updatePlan(id, dto, user.id);
    return { data };
  }

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN)
  async addTask(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body(new ZodValidationPipe(createTaskBodySchema)) dto: CreateTaskBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.addTask(planId, dto, user.id);
    return { data, message: 'Tarea agregada' };
  }

  @Patch(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  async updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(updateTaskWithRecurrenceSchema)) dto: UpdateTaskInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.updateTask(taskId, dto, user.id);
    return { data };
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  async removeTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.taskLifecycle.removeTask(taskId);
  }

  @Patch(':id/tasks/reorder')
  @Roles(UserRole.ADMIN)
  async reorderTasks(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body(new ZodValidationPipe(reorderTasksSchema)) dto: ReorderTasksInput,
  ) {
    const data = await this.taskLifecycle.reorderTasks(planId, dto);
    return { data };
  }

  @Get(':id/tasks/:taskId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskDetail(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user);
    const data = await this.taskNotes.getTaskDetail(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/complete')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async completeTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(completeTaskSchema)) dto: CompleteTaskInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.taskLifecycle.completeTask(taskId, user.id, dto, user);
    return { data, message: 'Tarea completada' };
  }

  @Get(':id/tasks/:taskId/logs')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskLogs(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user);
    const data = await this.taskNotes.getTaskLogs(taskId);
    return { data };
  }

  @Post(':id/tasks/:taskId/notes')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async addTaskNote(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body(new ZodValidationPipe(createTaskNoteSchema)) dto: CreateTaskNoteInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user);
    const data = await this.taskNotes.addTaskNote(taskId, user.id, dto);
    return { data, message: 'Nota agregada' };
  }

  @Get(':id/tasks/:taskId/notes')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getTaskNotes(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.taskLifecycle.verifyTaskAccess(taskId, user);
    const data = await this.taskNotes.getTaskNotes(taskId);
    return { data };
  }
}
