import type { BaseEntity, SoftDeletable } from '../index';
import type { TaskPriority, RecurrenceType, TaskStatus } from '../enums';
import type { Serialized } from './common';

export interface Task extends BaseEntity, SoftDeletable {
  maintenancePlanId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  recurrenceType: RecurrenceType;
  recurrenceMonths: number | null;
  nextDueDate: Date;
  order: number;
  status: TaskStatus;
}

export interface TaskLog {
  id: string;
  taskId: string;
  completedAt: Date;
  completedBy: string;
  notes: string | null;
  photoUrl: string | null;
}

export interface TaskNote {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export type TaskLogPublic = Serialized<Omit<TaskLog, 'completedBy'>> & {
  user: { id: string; name: string };
};

export type TaskNotePublic = Serialized<Omit<TaskNote, 'authorId'>> & {
  author: { id: string; name: string };
};

export type TaskPublic = Serialized<Omit<Task, 'categoryId' | 'deletedAt'>> & {
  category: { id: string; name: string; icon: string | null };
};

export type TaskDetailPublic = TaskPublic & {
  taskLogs: TaskLogPublic[];
  taskNotes: TaskNotePublic[];
};
