import { z } from 'zod';

export const idSchema: z.ZodString = z.string().uuid();

export * from './auth';
export * from './budget';
export * from './category';
export * from './inspection';
export * from './landing-settings';
export * from './maintenance-plan';
export * from './notification';
export * from './pagination';
export * from './property';
export * from './quote-template';
export * from './service-request';
export * from './task';
export * from './task-log';
export * from './task-note';
export * from './task-template';
export * from './user';
