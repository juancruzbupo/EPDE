import { z } from 'zod';

export const createPropertySchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  address: z.string().min(3, 'La dirección debe tener al menos 3 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  type: z.enum(['HOUSE', 'APARTMENT', 'DUPLEX', 'COUNTRY_HOUSE', 'OTHER']).default('HOUSE'),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  squareMeters: z.coerce.number().positive().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  address: z.string().min(3, 'La dirección debe tener al menos 3 caracteres').optional(),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').optional(),
  type: z.enum(['HOUSE', 'APARTMENT', 'DUPLEX', 'COUNTRY_HOUSE', 'OTHER']).optional(),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  squareMeters: z.coerce.number().positive().optional(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const propertyFiltersSchema = z.object({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  city: z.string().optional(),
  type: z.enum(['HOUSE', 'APARTMENT', 'DUPLEX', 'COUNTRY_HOUSE', 'OTHER']).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;
