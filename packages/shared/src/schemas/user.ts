import { z } from 'zod';

export const createClientSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().optional(),
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
