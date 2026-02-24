import { z } from 'zod';

export const createTaskNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'El contenido es requerido')
    .max(2000, 'El contenido no puede superar 2000 caracteres'),
});

export type CreateTaskNoteInput = z.infer<typeof createTaskNoteSchema>;
