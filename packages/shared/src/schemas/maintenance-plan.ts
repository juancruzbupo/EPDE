import { z } from 'zod';
import { PLAN_STATUS_VALUES, TASK_STATUS_VALUES } from '../types/enums';
import { TASKS_MAX_TAKE } from '../constants';

// ─── List Tasks Query ──────────────────────────────────

export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUS_VALUES).optional(),
  take: z.coerce.number().int().min(1).max(TASKS_MAX_TAKE).default(200),
});

export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;

// ─── Update Plan ───────────────────────────────────────

export const updatePlanSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional(),
  status: z.enum(PLAN_STATUS_VALUES).optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
