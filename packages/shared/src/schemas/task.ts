import { z } from 'zod';

function customRecurrenceRefine(
  data: { recurrenceType?: string; recurrenceMonths?: number },
  ctx: z.RefinementCtx,
) {
  if (data.recurrenceType === 'CUSTOM' && !data.recurrenceMonths) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'recurrenceMonths es requerido cuando recurrenceType es CUSTOM',
      path: ['recurrenceMonths'],
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
  recurrenceType: z
    .enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'])
    .default('ANNUAL'),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date(),
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
  recurrenceType: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM']).optional(),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date().optional(),
  status: z.enum(['PENDING', 'UPCOMING', 'OVERDUE', 'COMPLETED']).optional(),
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
