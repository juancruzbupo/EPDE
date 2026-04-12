import { z } from 'zod';

/**
 * Landing settings values are polymorphic JSON (different structure per key).
 * The pipe validates that a `value` field exists (not undefined/missing),
 * while the service handles per-key structure validation.
 */
export const updateLandingSettingSchema = z.object({
  value: z.unknown().refine((v) => v !== undefined, { message: 'value es requerido' }),
});
export type UpdateLandingSettingInput = z.infer<typeof updateLandingSettingSchema>;
