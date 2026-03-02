import { z } from 'zod';

export const idSchema: z.ZodString = z.string().uuid();
export const cuidSchema: z.ZodString = z.string().cuid();

export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export * from './auth';
export * from './user';
export * from './property';
export * from './category';
export * from './task';
export * from './maintenance-plan';
export * from './pagination';
export * from './task-log';
export * from './task-note';
export * from './budget';
export * from './service-request';
export * from './task-template';
