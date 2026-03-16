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
  taskId: z.string().uuid('ID de tarea inválido').optional(),
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
  note: z.string().max(500, 'La nota no puede superar 500 caracteres').optional(),
});

export type UpdateServiceStatusInput = z.infer<typeof updateServiceStatusSchema>;

// ─── Edit Service Request ────────────────────────────────

export const editServiceRequestSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar 200 caracteres')
    .optional(),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres')
    .optional(),
  urgency: z.enum(SERVICE_URGENCY_VALUES).optional(),
});

export type EditServiceRequestInput = z.infer<typeof editServiceRequestSchema>;

// ─── Service Request Comments ────────────────────────────

export const createServiceRequestCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(2000, 'El comentario no puede superar 2000 caracteres'),
});

export type CreateServiceRequestCommentInput = z.infer<typeof createServiceRequestCommentSchema>;

// ─── Service Request Attachments ─────────────────────────

export const addServiceRequestAttachmentsSchema = z.object({
  attachments: z
    .array(
      z.object({
        url: z.string().url('URL inválida'),
        fileName: z.string().min(1).max(255, 'Nombre de archivo muy largo'),
      }),
    )
    .min(1, 'Debe incluir al menos un adjunto')
    .max(10, 'Máximo 10 adjuntos por envío'),
});

export type AddServiceRequestAttachmentsInput = z.infer<typeof addServiceRequestAttachmentsSchema>;

// ─── Service Request Filters ────────────────────────────

export const serviceRequestFiltersSchema = z.object({
  status: z.enum(SERVICE_STATUS_VALUES).optional(),
  urgency: z.enum(SERVICE_URGENCY_VALUES).optional(),
  propertyId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type ServiceRequestFiltersInput = z.infer<typeof serviceRequestFiltersSchema>;
