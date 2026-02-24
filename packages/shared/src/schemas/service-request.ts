import { z } from 'zod';

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
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  photoUrls: z.array(z.string().url('URL de foto inválida')).max(5, 'Máximo 5 fotos').optional(),
});

export type CreateServiceRequestInput = z.input<typeof createServiceRequestSchema>;

// ─── Update Service Status ──────────────────────────────

export const updateServiceStatusSchema = z.object({
  status: z.enum(['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    message: 'Estado inválido',
  }),
});

export type UpdateServiceStatusInput = z.infer<typeof updateServiceStatusSchema>;

// ─── Service Request Filters ────────────────────────────

export const serviceRequestFiltersSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type ServiceRequestFiltersInput = z.infer<typeof serviceRequestFiltersSchema>;
