import { z } from 'zod';

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
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.coerce.number().nonnegative('El precio unitario no puede ser negativo'),
});

export const respondBudgetSchema = z.object({
  lineItems: z.array(budgetLineItemSchema).min(1, 'Debe agregar al menos un ítem'),
  estimatedDays: z.coerce
    .number()
    .int()
    .positive('Los días estimados deben ser mayor a 0')
    .optional(),
  notes: z.string().max(2000, 'Las notas no pueden superar 2000 caracteres').optional(),
  validUntil: z.string().datetime({ message: 'Fecha de validez inválida' }).optional(),
});

export type RespondBudgetInput = z.input<typeof respondBudgetSchema>;

// ─── Update Budget Status ───────────────────────────────

export const updateBudgetStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Estado inválido',
  }),
});

export type UpdateBudgetStatusInput = z.infer<typeof updateBudgetStatusSchema>;

// ─── Budget Filters ─────────────────────────────────────

export const budgetFiltersSchema = z.object({
  status: z
    .enum(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type BudgetFiltersInput = z.infer<typeof budgetFiltersSchema>;
