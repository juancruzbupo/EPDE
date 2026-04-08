import type {
  ProfessionalRequirement,
  PropertySector,
  RecurrenceType,
  TaskPriority,
  TaskType,
} from '../enums';

export interface CategoryTemplate {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  tasks: TaskTemplate[];
  createdAt: string;
  updatedAt: string;
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
  defaultSector: PropertySector | null;
  displayOrder: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
