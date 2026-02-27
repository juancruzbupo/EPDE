import { z } from 'zod';

export const updatePlanSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
