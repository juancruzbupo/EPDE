import { z } from 'zod';

import {
  TECHNICAL_INSPECTION_PAYMENT_STATUS_VALUES,
  TECHNICAL_INSPECTION_STATUS_VALUES,
  TECHNICAL_INSPECTION_TYPE_VALUES,
} from '../types/enums';

// ─── List filters ────────────────────────────────────────

export const technicalInspectionFiltersSchema = z.object({
  status: z.enum(TECHNICAL_INSPECTION_STATUS_VALUES).optional(),
  type: z.enum(TECHNICAL_INSPECTION_TYPE_VALUES).optional(),
  propertyId: z.string().uuid().optional(),
  feeStatus: z.enum(TECHNICAL_INSPECTION_PAYMENT_STATUS_VALUES).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
export type TechnicalInspectionFiltersInput = z.infer<typeof technicalInspectionFiltersSchema>;

// ─── Create (client) ─────────────────────────────────────

export const createTechnicalInspectionSchema = z.object({
  propertyId: z.string().uuid('Propiedad inválida'),
  type: z.enum(TECHNICAL_INSPECTION_TYPE_VALUES),
  clientNotes: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
});
export type CreateTechnicalInspectionInput = z.infer<typeof createTechnicalInspectionSchema>;

// ─── Admin actions ───────────────────────────────────────

export const scheduleInspectionSchema = z.object({
  scheduledFor: z.string().datetime({ offset: true }),
  adminNotes: z.string().max(4000).optional(),
});
export type ScheduleInspectionInput = z.infer<typeof scheduleInspectionSchema>;

export const updateInspectionStatusSchema = z.object({
  status: z.enum(TECHNICAL_INSPECTION_STATUS_VALUES),
  adminNotes: z.string().max(4000).optional(),
});
export type UpdateInspectionStatusInput = z.infer<typeof updateInspectionStatusSchema>;

export const uploadDeliverableSchema = z.object({
  deliverableUrl: z.string().url('URL inválida'),
  deliverableFileName: z
    .string()
    .min(1, 'Nombre de archivo requerido')
    .max(200, 'Nombre muy largo'),
});
export type UploadDeliverableInput = z.infer<typeof uploadDeliverableSchema>;

export const markInspectionPaidSchema = z.object({
  paymentMethod: z.string().min(1, 'Método de pago requerido').max(50, 'Método muy largo'),
  paymentReceiptUrl: z.string().url().nullable().optional(),
});
export type MarkInspectionPaidInput = z.infer<typeof markInspectionPaidSchema>;
