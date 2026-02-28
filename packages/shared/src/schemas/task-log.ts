import { z } from 'zod';

export const completeTaskSchema = z.object({
  result: z.enum([
    'OK',
    'OK_WITH_OBSERVATIONS',
    'NEEDS_ATTENTION',
    'NEEDS_REPAIR',
    'NEEDS_URGENT_REPAIR',
    'NOT_APPLICABLE',
  ]),
  conditionFound: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']),
  executor: z.enum(['OWNER', 'HIRED_PROFESSIONAL', 'EPDE_PROFESSIONAL']),
  actionTaken: z.enum([
    'INSPECTION_ONLY',
    'CLEANING',
    'MINOR_REPAIR',
    'MAJOR_REPAIR',
    'REPLACEMENT',
    'TREATMENT',
    'SEALING',
    'ADJUSTMENT',
    'FULL_SERVICE',
    'NO_ACTION',
  ]),
  completedAt: z.coerce.date().optional(),
  cost: z.coerce.number().min(0, 'El costo debe ser positivo').optional(),
  note: z.string().max(500, 'Máximo 500 caracteres').optional(),
  photoUrl: z.string().url('URL de foto inválida').optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
