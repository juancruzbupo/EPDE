import { z } from 'zod';

import { PROPERTY_SECTOR_VALUES } from '../types/enums';

const INSPECTION_ITEM_STATUS_VALUES = [
  'PENDING',
  'OK',
  'NEEDS_ATTENTION',
  'NEEDS_PROFESSIONAL',
] as const;

export const createInspectionSchema = z.object({
  propertyId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  items: z.array(
    z.object({
      sector: z.enum(PROPERTY_SECTOR_VALUES),
      name: z.string().min(2).max(200),
      description: z.string().max(2000).optional(),
      status: z.enum(INSPECTION_ITEM_STATUS_VALUES).default('PENDING'),
      finding: z.string().max(2000).optional(),
      photoUrl: z.string().url().optional(),
      taskTemplateId: z.string().uuid().optional(),
      isCustom: z.boolean().default(false),
      order: z.number().int().min(0).default(0),
    }),
  ),
});
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;

export const updateInspectionItemSchema = z.object({
  status: z.enum(INSPECTION_ITEM_STATUS_VALUES).optional(),
  finding: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
});
export type UpdateInspectionItemInput = z.infer<typeof updateInspectionItemSchema>;

export const addInspectionItemSchema = z.object({
  sector: z.enum(PROPERTY_SECTOR_VALUES),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  isCustom: z.boolean().default(true),
});
export type AddInspectionItemInput = z.infer<typeof addInspectionItemSchema>;

export const linkTaskSchema = z.object({
  taskId: z.string().uuid('ID de tarea inválido'),
});
export type LinkTaskInput = z.infer<typeof linkTaskSchema>;

export const updateNotesSchema = z.object({
  notes: z.string().max(2000, 'Máximo 2000 caracteres'),
});
export type UpdateNotesInput = z.infer<typeof updateNotesSchema>;

export const generatePlanFromInspectionSchema = z.object({
  planName: z.string().min(2).max(200),
});
export type GeneratePlanFromInspectionInput = z.infer<typeof generatePlanFromInspectionSchema>;
