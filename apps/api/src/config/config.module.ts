import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const baseSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RESEND_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
});

const envSchema = baseSchema.superRefine((data, ctx) => {
  // CORS_ORIGIN required in production and staging
  if (['production', 'staging'].includes(data.NODE_ENV) && !data.CORS_ORIGIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'CORS_ORIGIN is required in production and staging',
    });
  }

  // Validate each CORS origin is a valid URL and HTTPS in production
  if (data.CORS_ORIGIN) {
    for (const origin of data.CORS_ORIGIN.split(',').map((o) => o.trim())) {
      try {
        const url = new URL(origin);
        if (data.NODE_ENV === 'production' && url.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['CORS_ORIGIN'],
            message: `CORS origin must use HTTPS in production: ${origin}`,
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `Invalid URL in CORS_ORIGIN: ${origin}`,
        });
      }
    }
  }

  // Connection pooling recommended in production
  if (data.NODE_ENV === 'production' && !data.DATABASE_URL.includes('connection_limit=')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message:
        'DATABASE_URL should include connection_limit param in production (e.g., ?connection_limit=10)',
    });
  }

  // Redis TLS required in production
  if (data.NODE_ENV === 'production' && !data.REDIS_URL.startsWith('rediss://')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['REDIS_URL'],
      message: 'REDIS_URL must use TLS (rediss://) in production',
    });
  }
});

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          throw new Error(
            `Config validation error: ${parsed.error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          );
        }
        return parsed.data;
      },
    }),
  ],
})
export class ConfigModule {}
