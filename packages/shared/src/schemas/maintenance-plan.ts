import { z } from 'zod';
import { PLAN_STATUS_VALUES } from '../types/enums';

export const updatePlanSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional(),
  status: z.enum(PLAN_STATUS_VALUES).optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
