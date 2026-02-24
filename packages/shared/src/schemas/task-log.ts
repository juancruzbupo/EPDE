import { z } from 'zod';

export const completeTaskSchema = z.object({
  notes: z.string().max(1000, 'Las notas no pueden superar 1000 caracteres').optional(),
  photoUrl: z.string().url('URL de foto inválida').optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
