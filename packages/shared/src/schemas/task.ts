import { z } from 'zod';

export const createTaskSchema = z.object({
  maintenancePlanId: z.string().uuid('ID de plan inválido'),
  categoryId: z.string().uuid('ID de categoría inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  recurrenceType: z
    .enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'])
    .default('ANNUAL'),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  categoryId: z.string().uuid('ID de categoría inválido').optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  recurrenceType: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM']).optional(),
  recurrenceMonths: z.coerce.number().int().min(1).max(120).optional(),
  nextDueDate: z.coerce.date().optional(),
  status: z.enum(['PENDING', 'UPCOMING', 'OVERDUE', 'COMPLETED']).optional(),
});

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
