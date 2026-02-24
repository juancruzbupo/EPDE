import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { PrismaService } from '../prisma/prisma.service';
import { recurrenceTypeToMonths } from '@epde/shared';

@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getPlan(id: string) {
    const plan = await this.plansRepository.findWithFullDetails(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }
    return this.plansRepository.update(id, dto);
  }

  async addTask(planId: string, dto: CreateTaskDto) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    const maxOrder = await this.tasksRepository.getMaxOrder(planId);

    return this.tasksRepository.create(
      {
        maintenancePlan: { connect: { id: planId } },
        category: { connect: { id: dto.categoryId } },
        name: dto.name,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        recurrenceType: dto.recurrenceType ?? 'ANNUAL',
        recurrenceMonths:
          dto.recurrenceType === 'CUSTOM'
            ? dto.recurrenceMonths
            : recurrenceTypeToMonths(dto.recurrenceType ?? 'ANNUAL'),
        nextDueDate: new Date(dto.nextDueDate),
        order: maxOrder + 1,
        status: 'PENDING',
      },
      { category: true },
    );
  }

  async updateTask(taskId: string, dto: UpdateTaskDto) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...dto };
    if (dto.nextDueDate) {
      data.nextDueDate = new Date(dto.nextDueDate);
    }
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
      delete data.categoryId;
    }

    return this.tasksRepository.update(taskId, data, { category: true });
  }

  async removeTask(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    await this.tasksRepository.softDelete(taskId);
    return { message: 'Tarea eliminada' };
  }

  async reorderTasks(planId: string, dto: ReorderTasksDto) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    await this.prisma.$transaction(
      dto.tasks.map((item) =>
        this.prisma.task.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return this.tasksRepository.findByPlanId(planId);
  }
}
