import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';
import { PROPERTY_TYPE_VALUES, PropertyType } from '../types/enums';

export const createPropertySchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  address: z
    .string()
    .trim()
    .min(3, 'La dirección debe tener al menos 3 caracteres')
    .max(500, 'La dirección no puede superar 500 caracteres'),
  city: z
    .string()
    .trim()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(200, 'La ciudad no puede superar 200 caracteres'),
  type: z.enum(PROPERTY_TYPE_VALUES).default(PropertyType.HOUSE),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  squareMeters: z.coerce.number().positive().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, 'La dirección debe tener al menos 3 caracteres')
    .max(500, 'La dirección no puede superar 500 caracteres')
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(200, 'La ciudad no puede superar 200 caracteres')
    .optional(),
  type: z.enum(PROPERTY_TYPE_VALUES).optional(),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  squareMeters: z.coerce.number().positive().optional(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const propertyFiltersSchema = z.object({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  city: z.string().optional(),
  type: z.enum(PROPERTY_TYPE_VALUES).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;
