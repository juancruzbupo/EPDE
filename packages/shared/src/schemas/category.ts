import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede superar 500 caracteres').optional(),
  icon: z.string().max(50).optional(),
  order: z.coerce.number().int().min(0).optional(),
  categoryTemplateId: z.string().uuid().nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .optional(),
  description: z.string().max(500, 'La descripción no puede superar 500 caracteres').optional(),
  icon: z.string().max(50).optional(),
  order: z.coerce.number().int().min(0).optional(),
  categoryTemplateId: z.string().uuid().nullable().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type CategoryFilters = z.infer<typeof categoryFiltersSchema>;
