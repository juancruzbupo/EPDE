import { z } from 'zod';

const TASK_TYPES = [
  'INSPECTION',
  'CLEANING',
  'TEST',
  'TREATMENT',
  'SEALING',
  'LUBRICATION',
  'ADJUSTMENT',
  'MEASUREMENT',
  'EVALUATION',
] as const;

const PROFESSIONAL_REQUIREMENTS = [
  'OWNER_CAN_DO',
  'PROFESSIONAL_RECOMMENDED',
  'PROFESSIONAL_REQUIRED',
] as const;

const RECURRENCE_TYPES = [
  'MONTHLY',
  'QUARTERLY',
  'BIANNUAL',
  'ANNUAL',
  'CUSTOM',
  'ON_DETECTION',
] as const;

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
  taskType: z.enum(TASK_TYPES),
  professionalRequirement: z.enum(PROFESSIONAL_REQUIREMENTS).default('OWNER_CAN_DO'),
  technicalDescription: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  recurrenceType: z.enum(RECURRENCE_TYPES),
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
  take: z.coerce.number().int().min(1).max(100).default(20),
});
export type CategoryTemplateFiltersInput = z.infer<typeof categoryTemplateFiltersSchema>;
