import type { CreateTaskNoteInput } from '@epde/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TaskNotesService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogsRepository: TaskLogsRepository,
    private readonly taskNotesRepository: TaskNotesRepository,
  ) {}

  async getTaskDetail(taskId: string) {
    const task = await this.tasksRepository.findWithDetails(taskId);

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return task;
  }

  async getTaskLogs(taskId: string) {
    return this.taskLogsRepository.findByTaskId(taskId);
  }

  async getTaskNotes(taskId: string) {
    return this.taskNotesRepository.findByTaskId(taskId);
  }

  async addTaskNote(taskId: string, userId: string, dto: CreateTaskNoteInput) {
    return this.taskNotesRepository.createForTask(taskId, userId, dto.content);
  }
}
