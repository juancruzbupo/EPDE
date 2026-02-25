import { Controller, Get, Post, Patch, Delete, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MaintenancePlansService } from './maintenance-plans.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateTaskNoteDto } from './dto/create-task-note.dto';

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
  @Roles('ADMIN')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.plansService.updatePlan(id, dto);
    return { data };
  }

  @Post(':id/tasks')
  @Roles('ADMIN')
  async addTask(@Param('id') planId: string, @Body() dto: CreateTaskDto) {
    const data = await this.plansService.addTask(planId, dto);
    return { data, message: 'Tarea agregada' };
  }

  @Patch(':id/tasks/:taskId')
  @Roles('ADMIN')
  async updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    const data = await this.plansService.updateTask(taskId, dto);
    return { data };
  }

  @Delete(':id/tasks/:taskId')
  @Roles('ADMIN')
  async removeTask(@Param('taskId') taskId: string) {
    return this.plansService.removeTask(taskId);
  }

  @Put(':id/tasks/reorder')
  @Roles('ADMIN')
  async reorderTasks(@Param('id') planId: string, @Body() dto: ReorderTasksDto) {
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
    @Body() dto: CompleteTaskDto,
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
    @Body() dto: CreateTaskNoteDto,
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
