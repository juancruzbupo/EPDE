import { Controller, Get, Post, Patch, Delete, Put, Param, Body } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { MaintenancePlansService } from './maintenance-plans.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';

@Controller('maintenance-plans')
@Roles('ADMIN')
export class MaintenancePlansController {
  constructor(private readonly plansService: MaintenancePlansService) {}

  @Get(':id')
  async getPlan(@Param('id') id: string) {
    const data = await this.plansService.getPlan(id);
    return { data };
  }

  @Patch(':id')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.plansService.updatePlan(id, dto);
    return { data };
  }

  @Post(':id/tasks')
  async addTask(@Param('id') planId: string, @Body() dto: CreateTaskDto) {
    const data = await this.plansService.addTask(planId, dto);
    return { data, message: 'Tarea agregada' };
  }

  @Patch(':id/tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    const data = await this.plansService.updateTask(taskId, dto);
    return { data };
  }

  @Delete(':id/tasks/:taskId')
  async removeTask(@Param('taskId') taskId: string) {
    return this.plansService.removeTask(taskId);
  }

  @Put(':id/tasks/reorder')
  async reorderTasks(@Param('id') planId: string, @Body() dto: ReorderTasksDto) {
    const data = await this.plansService.reorderTasks(planId, dto);
    return { data };
  }
}
