import { z } from 'zod';

// ─── Quote Template Line Item ──────────────────────────

const quoteTemplateItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.coerce.number().positive('Cantidad debe ser positiva'),
  unitPrice: z.coerce.number().min(0, 'Precio no puede ser negativo'),
});

// ─── Create Quote Template ─────────────────────────────

export const createQuoteTemplateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  items: z.array(quoteTemplateItemSchema).min(1, 'Debe incluir al menos un item'),
});

export type CreateQuoteTemplateInput = z.infer<typeof createQuoteTemplateSchema>;

// ─── Update Quote Template ─────────────────────────────

export const updateQuoteTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  items: z.array(quoteTemplateItemSchema).min(1).optional(),
});

export type UpdateQuoteTemplateInput = z.infer<typeof updateQuoteTemplateSchema>;
