import { z } from 'zod';

// ─── Push Token ────────────────────────────────────────

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido').max(500),
  platform: z.enum(['ios', 'android', 'web'], { message: 'Plataforma inválida' }),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export const removePushTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido').max(500),
});

export type RemovePushTokenInput = z.infer<typeof removePushTokenSchema>;
