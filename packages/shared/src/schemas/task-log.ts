import { z } from 'zod';

import {
  ACTION_TAKEN_VALUES,
  CONDITION_FOUND_VALUES,
  TASK_EXECUTOR_VALUES,
  TASK_RESULT_VALUES,
} from '../types/enums';

export const completeTaskSchema = z.object({
  result: z.enum(TASK_RESULT_VALUES),
  conditionFound: z.enum(CONDITION_FOUND_VALUES),
  executor: z.enum(TASK_EXECUTOR_VALUES),
  actionTaken: z.enum(ACTION_TAKEN_VALUES),
  completedAt: z.coerce.date().optional(),
  cost: z.coerce.number().min(0, 'El costo debe ser positivo').optional(),
  note: z.string().max(500, 'Máximo 500 caracteres').optional(),
  photoUrl: z.string().url('URL de foto inválida').optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
