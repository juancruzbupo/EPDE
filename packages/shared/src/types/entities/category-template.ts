import type { TaskType, ProfessionalRequirement, TaskPriority, RecurrenceType } from '../enums';

export interface CategoryTemplate {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  tasks: TaskTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  taskType: TaskType;
  professionalRequirement: ProfessionalRequirement;
  technicalDescription: string | null;
  priority: TaskPriority;
  recurrenceType: RecurrenceType;
  recurrenceMonths: number;
  estimatedDurationMinutes: number | null;
  displayOrder: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}
