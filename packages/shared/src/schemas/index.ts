import { z } from 'zod';

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export * from './auth';
