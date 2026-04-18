import { z } from 'zod';

import {
  PROFESSIONAL_ATTACHMENT_TYPE_VALUES,
  PROFESSIONAL_AVAILABILITY_VALUES,
  PROFESSIONAL_PAYMENT_STATUS_VALUES,
  PROFESSIONAL_SPECIALTY_VALUES,
  PROFESSIONAL_TIER_VALUES,
} from '../types/enums';

// ─── List filters ────────────────────────────────────────

export const professionalFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  specialty: z.enum(PROFESSIONAL_SPECIALTY_VALUES).optional(),
  tier: z.enum(PROFESSIONAL_TIER_VALUES).optional(),
  availability: z.enum(PROFESSIONAL_AVAILABILITY_VALUES).optional(),
  serviceArea: z.string().max(100).optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProfessionalFiltersInput = z.infer<typeof professionalFiltersSchema>;

// ─── Create / Update ─────────────────────────────────────

const baseProfessionalFields = {
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  email: z.string().email('Email inválido').max(254),
  phone: z.string().min(6, 'Teléfono inválido').max(30),
  photoUrl: z.string().url().nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  registrationNumber: z
    .string()
    .min(2, 'Número de matrícula requerido')
    .max(50, 'Matrícula no puede superar 50 caracteres'),
  registrationBody: z
    .string()
    .min(2, 'Órgano registrador requerido')
    .max(200, 'Órgano registrador no puede superar 200 caracteres'),
  serviceAreas: z
    .array(z.string().min(1).max(100))
    .min(1, 'Agregá al menos una zona de trabajo')
    .max(20, 'Máximo 20 zonas'),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).nullable().optional(),
  hourlyRateMin: z.coerce.number().min(0).nullable().optional(),
  hourlyRateMax: z.coerce.number().min(0).nullable().optional(),
  specialties: z
    .array(
      z.object({
        specialty: z.enum(PROFESSIONAL_SPECIALTY_VALUES),
        isPrimary: z.boolean().default(false),
      }),
    )
    .min(1, 'Agregá al menos una especialidad')
    .max(13, 'No podés tener más de 13 especialidades'),
  notes: z.string().max(4000).nullable().optional(),
};

export const createProfessionalSchema = z
  .object(baseProfessionalFields)
  .refine((data) => data.specialties.filter((s) => s.isPrimary).length <= 1, {
    message: 'Solo una especialidad puede ser primaria',
    path: ['specialties'],
  })
  .refine(
    (data) =>
      data.hourlyRateMin == null ||
      data.hourlyRateMax == null ||
      data.hourlyRateMin <= data.hourlyRateMax,
    { message: 'Tarifa mínima debe ser menor o igual a la máxima', path: ['hourlyRateMax'] },
  );
export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;

export const updateProfessionalSchema = z.object({
  name: baseProfessionalFields.name.optional(),
  email: baseProfessionalFields.email.optional(),
  phone: baseProfessionalFields.phone.optional(),
  photoUrl: baseProfessionalFields.photoUrl,
  bio: baseProfessionalFields.bio,
  registrationNumber: baseProfessionalFields.registrationNumber.optional(),
  registrationBody: baseProfessionalFields.registrationBody.optional(),
  serviceAreas: baseProfessionalFields.serviceAreas.optional(),
  yearsOfExperience: baseProfessionalFields.yearsOfExperience,
  hourlyRateMin: baseProfessionalFields.hourlyRateMin,
  hourlyRateMax: baseProfessionalFields.hourlyRateMax,
  specialties: baseProfessionalFields.specialties.optional(),
  notes: baseProfessionalFields.notes,
});
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;

// ─── Tier / Availability ─────────────────────────────────

export const updateTierSchema = z
  .object({
    tier: z.enum(PROFESSIONAL_TIER_VALUES),
    blockedReason: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => data.tier !== 'BLOCKED' || (data.blockedReason && data.blockedReason.length > 0),
    { message: 'Razón obligatoria al bloquear', path: ['blockedReason'] },
  );
export type UpdateTierInput = z.infer<typeof updateTierSchema>;

export const updateAvailabilitySchema = z.object({
  availability: z.enum(PROFESSIONAL_AVAILABILITY_VALUES),
  availableUntil: z.string().datetime({ offset: true }).nullable().optional(),
});
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

// ─── Ratings ─────────────────────────────────────────────

export const createRatingSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  punctuality: z.coerce.number().int().min(1).max(5).nullable().optional(),
  quality: z.coerce.number().int().min(1).max(5).nullable().optional(),
  priceValue: z.coerce.number().int().min(1).max(5).nullable().optional(),
  adminComment: z.string().max(2000).nullable().optional(),
  clientComment: z.string().max(2000).nullable().optional(),
  serviceRequestId: z.string().uuid().nullable().optional(),
});
export type CreateRatingInput = z.infer<typeof createRatingSchema>;

// ─── Timeline notes ──────────────────────────────────────

export const createTimelineNoteSchema = z.object({
  content: z.string().min(1, 'Agregá contenido').max(2000, 'Máximo 2000 caracteres'),
});
export type CreateTimelineNoteInput = z.infer<typeof createTimelineNoteSchema>;

// ─── Tags ────────────────────────────────────────────────

export const createTagSchema = z.object({
  tag: z
    .string()
    .min(2, 'Tag muy corto')
    .max(50, 'Tag muy largo')
    .regex(/^#?[a-zA-Z_]+$/, 'Solo letras y guiones bajos, opcionalmente con #'),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

// ─── Attachments ─────────────────────────────────────────

export const createAttachmentSchema = z.object({
  type: z.enum(PROFESSIONAL_ATTACHMENT_TYPE_VALUES),
  url: z.string().url(),
  fileName: z.string().min(1).max(200),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

// ─── Assignments ─────────────────────────────────────────

export const createAssignmentSchema = z.object({
  professionalId: z.string().uuid(),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

// ─── Payments ────────────────────────────────────────────

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive('Monto debe ser positivo'),
  serviceRequestId: z.string().uuid().nullable().optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PROFESSIONAL_PAYMENT_STATUS_VALUES),
  paymentMethod: z.string().max(50).nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
});
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

// ─── Suggestions query ───────────────────────────────────

export const suggestedProfessionalsQuerySchema = z.object({
  specialty: z.enum(PROFESSIONAL_SPECIALTY_VALUES),
  serviceArea: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(3),
});
export type SuggestedProfessionalsQuery = z.infer<typeof suggestedProfessionalsQuerySchema>;
