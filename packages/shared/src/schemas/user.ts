import { z } from 'zod';

export const createClientSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(254, 'El email no puede superar 254 caracteres'),
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  phone: z.string().trim().max(30, 'El teléfono no puede superar 30 caracteres').optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional(),
  phone: z.string().trim().max(30, 'El teléfono no puede superar 30 caracteres').optional(),
  status: z.enum(['INVITED', 'ACTIVE', 'INACTIVE']).optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['INVITED', 'ACTIVE', 'INACTIVE']).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;
