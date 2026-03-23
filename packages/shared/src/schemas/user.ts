import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';
import { USER_STATUS_VALUES } from '../types/enums';

export const createClientSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
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
  status: z.enum(USER_STATUS_VALUES).optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: z.string().max(30).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Se requiere al menos un ID').max(50),
});
export type BulkIdsInput = z.infer<typeof bulkIdsSchema>;
