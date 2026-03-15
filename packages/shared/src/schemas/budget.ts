import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';
import { BUDGET_STATUS_VALUES, BudgetStatus } from '../types/enums';

// ─── Create Budget Request ──────────────────────────────

export const createBudgetRequestSchema = z.object({
  propertyId: z.string().uuid('ID de propiedad inválido'),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),
  description: z.string().max(2000, 'La descripción no puede superar 2000 caracteres').optional(),
});

export type CreateBudgetRequestInput = z.infer<typeof createBudgetRequestSchema>;

// ─── Respond to Budget (Admin quotes) ───────────────────

const budgetLineItemSchema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0').max(999_999),
  unitPrice: z.coerce
    .number()
    .nonnegative('El precio unitario no puede ser negativo')
    .max(999_999_999),
});

export const respondBudgetSchema = z.object({
  lineItems: z.array(budgetLineItemSchema).min(1, 'Debe agregar al menos un ítem').max(50),
  estimatedDays: z.coerce
    .number()
    .int()
    .positive('Los días estimados deben ser mayor a 0')
    .optional(),
  notes: z.string().max(2000, 'Las notas no pueden superar 2000 caracteres').optional(),
  validUntil: z.string().date('Fecha de validez inválida').optional(),
});

export type RespondBudgetInput = z.input<typeof respondBudgetSchema>;

// ─── Update Budget Status ───────────────────────────────

export const updateBudgetStatusSchema = z.object({
  status: z.enum(
    [
      BudgetStatus.APPROVED,
      BudgetStatus.REJECTED,
      BudgetStatus.IN_PROGRESS,
      BudgetStatus.COMPLETED,
    ],
    { message: 'Estado inválido' },
  ),
});

export type UpdateBudgetStatusInput = z.infer<typeof updateBudgetStatusSchema>;

// ─── Budget Filters ─────────────────────────────────────

export const budgetFiltersSchema = z.object({
  status: z.enum(BUDGET_STATUS_VALUES).optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
});

export type BudgetFiltersInput = z.infer<typeof budgetFiltersSchema>;

// ─── Edit Budget Request (client, PENDING only) ────────

export const editBudgetRequestSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar 200 caracteres')
    .optional(),
  description: z
    .string()
    .max(2000, 'La descripción no puede superar 2000 caracteres')
    .nullable()
    .optional(),
});

export type EditBudgetRequestInput = z.infer<typeof editBudgetRequestSchema>;

// ─── Budget Comment ────────────────────────────────────

export const createBudgetCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario es requerido')
    .max(2000, 'El comentario no puede superar 2000 caracteres'),
});

export type CreateBudgetCommentInput = z.infer<typeof createBudgetCommentSchema>;

// ─── Budget Attachments ────────────────────────────────

export const addBudgetAttachmentsSchema = z.object({
  attachments: z
    .array(
      z.object({
        url: z.string().url('URL inválida'),
        fileName: z.string().min(1, 'Nombre de archivo requerido').max(255),
      }),
    )
    .min(1, 'Debe agregar al menos un archivo')
    .max(10, 'Máximo 10 archivos por vez'),
});

export type AddBudgetAttachmentsInput = z.infer<typeof addBudgetAttachmentsSchema>;
