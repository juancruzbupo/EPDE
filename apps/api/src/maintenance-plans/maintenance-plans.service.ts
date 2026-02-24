import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateTaskNoteDto } from './dto/create-task-note.dto';
import { PrismaService } from '../prisma/prisma.service';
import { recurrenceTypeToMonths, getNextDueDate } from '@epde/shared';

@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogsRepository: TaskLogsRepository,
    private readonly taskNotesRepository: TaskNotesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getPlan(id: string, currentUser?: { id: string; role: string }) {
    const plan = await this.plansRepository.findWithFullDetails(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    if (currentUser?.role === 'CLIENT') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const property = (plan as any).property;
      if (property?.userId !== currentUser.id) {
        throw new ForbiddenException('No tenés acceso a este plan');
      }
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

  async getTaskDetail(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        category: true,
        taskLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { completedAt: 'desc' },
          take: 20,
        },
        taskNotes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return task;
  }

  async completeTask(taskId: string, userId: string, dto: CompleteTaskDto) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const recurrenceMonths = task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType);
    const newDueDate = getNextDueDate(task.nextDueDate, recurrenceMonths);

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.taskLog.create({
        data: {
          taskId,
          completedBy: userId,
          notes: dto.notes,
          photoUrl: dto.photoUrl,
        },
        include: { user: { select: { id: true, name: true } } },
      });

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: 'PENDING', nextDueDate: newDueDate },
        include: { category: true },
      });

      return { task: updatedTask, log };
    });
  }

  async getTaskLogs(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.taskLogsRepository.findByTaskId(taskId);
  }

  async addTaskNote(taskId: string, userId: string, dto: CreateTaskNoteDto) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return this.prisma.taskNote.create({
      data: {
        taskId,
        authorId: userId,
        content: dto.content,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async getTaskNotes(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.taskNotesRepository.findByTaskId(taskId);
  }
}
