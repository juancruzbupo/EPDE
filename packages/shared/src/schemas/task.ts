import { z } from 'zod';

const RECURRENCE_TYPES = [
  'MONTHLY',
  'QUARTERLY',
  'BIANNUAL',
  'ANNUAL',
  'CUSTOM',
  'ON_DETECTION',
] as const;

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

function customRecurrenceRefine(
  data: { recurrenceType?: string; recurrenceMonths?: number; nextDueDate?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (data.recurrenceType === 'CUSTOM' && !data.recurrenceMonths) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'recurrenceMonths es requerido cuando recurrenceType es CUSTOM',
      path: ['recurrenceMonths'],
    });
  }
  if (data.recurrenceType !== 'ON_DETECTION' && !data.nextDueDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'nextDueDate es requerido excepto para tareas ON_DETECTION',
      path: ['nextDueDate'],
    });
  }
}

export const createTaskSchema = z.object({
  maintenancePlanId: z.string().uuid('ID de plan inválido'),
  categoryId: z.string().uuid('ID de categoría inválido'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  description: z.string().max(2000, 'La descripción no puede superar 2000 caracteres').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  recurrenceType: z.enum(RECURRENCE_TYPES).default('ANNUAL'),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date().optional(),
  taskType: z.enum(TASK_TYPES).default('INSPECTION'),
  professionalRequirement: z.enum(PROFESSIONAL_REQUIREMENTS).default('OWNER_CAN_DO'),
  technicalDescription: z.string().max(1000).optional(),
  estimatedDurationMinutes: z.coerce.number().int().min(1).optional(),
});

export const createTaskWithRecurrenceSchema = createTaskSchema.superRefine(customRecurrenceRefine);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  categoryId: z.string().uuid('ID de categoría inválido').optional(),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional(),
  description: z.string().max(2000, 'La descripción no puede superar 2000 caracteres').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  recurrenceType: z.enum(RECURRENCE_TYPES).optional(),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date().optional().nullable(),
  status: z.enum(['PENDING', 'UPCOMING', 'OVERDUE', 'COMPLETED']).optional(),
  taskType: z.enum(TASK_TYPES).optional(),
  professionalRequirement: z.enum(PROFESSIONAL_REQUIREMENTS).optional(),
  technicalDescription: z.string().max(1000).optional().nullable(),
  estimatedDurationMinutes: z.coerce.number().int().min(1).optional().nullable(),
});

export const updateTaskWithRecurrenceSchema = updateTaskSchema.superRefine(customRecurrenceRefine);

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    }),
  ),
});

export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
