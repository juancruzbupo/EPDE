import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';
import {
  PROFESSIONAL_REQUIREMENT_VALUES,
  ProfessionalRequirement,
  RECURRENCE_TYPE_VALUES,
  TASK_PRIORITY_VALUES,
  TASK_TYPE_VALUES,
  TaskPriority,
} from '../types/enums';

export const createCategoryTemplateSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  icon: z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export type CreateCategoryTemplateInput = z.infer<typeof createCategoryTemplateSchema>;

export const updateCategoryTemplateSchema = createCategoryTemplateSchema.partial();
export type UpdateCategoryTemplateInput = z.infer<typeof updateCategoryTemplateSchema>;

export const createTaskTemplateSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(200),
  taskType: z.enum(TASK_TYPE_VALUES),
  professionalRequirement: z
    .enum(PROFESSIONAL_REQUIREMENT_VALUES)
    .default(ProfessionalRequirement.OWNER_CAN_DO),
  technicalDescription: z.string().max(1000).optional(),
  priority: z.enum(TASK_PRIORITY_VALUES).default(TaskPriority.MEDIUM),
  recurrenceType: z.enum(RECURRENCE_TYPE_VALUES),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).default(12),
  estimatedDurationMinutes: z.coerce.number().int().min(1).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});
export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;

export const updateTaskTemplateSchema = createTaskTemplateSchema.partial();
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;

export const reorderTemplatesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Debe incluir al menos un ID'),
});
export type ReorderTemplatesInput = z.infer<typeof reorderTemplatesSchema>;

export const categoryTemplateFiltersSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});
export type CategoryTemplateFiltersInput = z.infer<typeof categoryTemplateFiltersSchema>;
