import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';
import {
  SERVICE_STATUS_VALUES,
  SERVICE_URGENCY_VALUES,
  ServiceStatus,
  ServiceUrgency,
} from '../types/enums';

// ─── Create Service Request ─────────────────────────────

export const createServiceRequestSchema = z.object({
  propertyId: z.string().uuid('ID de propiedad inválido'),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres'),
  urgency: z.enum(SERVICE_URGENCY_VALUES).default(ServiceUrgency.MEDIUM),
  photoUrls: z.array(z.string().url('URL de foto inválida')).max(5, 'Máximo 5 fotos').optional(),
});

export type CreateServiceRequestInput = z.input<typeof createServiceRequestSchema>;

// ─── Update Service Status ──────────────────────────────

export const updateServiceStatusSchema = z.object({
  status: z.enum(
    [
      ServiceStatus.IN_REVIEW,
      ServiceStatus.IN_PROGRESS,
      ServiceStatus.RESOLVED,
      ServiceStatus.CLOSED,
    ],
    {
      message: 'Estado inválido',
    },
  ),
});

export type UpdateServiceStatusInput = z.infer<typeof updateServiceStatusSchema>;

// ─── Service Request Filters ────────────────────────────

export const serviceRequestFiltersSchema = z.object({
  status: z.enum(SERVICE_STATUS_VALUES).optional(),
  urgency: z.enum(SERVICE_URGENCY_VALUES).optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type ServiceRequestFiltersInput = z.infer<typeof serviceRequestFiltersSchema>;
