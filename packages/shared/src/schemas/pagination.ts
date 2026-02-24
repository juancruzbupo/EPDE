import { z } from 'zod';

export const cursorPaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
