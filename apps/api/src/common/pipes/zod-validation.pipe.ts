import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodObject, ZodSchema } from 'zod';

/**
 * Wraps a Zod schema as a NestJS pipe.
 *
 * **Defense-in-depth:** When the schema is a `ZodObject` with default (strip) unknown-key
 * handling, we transparently apply `.strict()` — unknown keys in the request body/query are
 * rejected with HTTP 400 instead of silently being stripped. This prevents mass-assignment
 * attacks where a client sends unexpected fields (e.g. `userId`, `role`) hoping they reach
 * `prisma.*.update({ data: dto })` via spread.
 *
 * If a schema legitimately needs to accept unknown keys, use `z.object({...}).passthrough()`
 * explicitly — the pipe detects the explicit opt-out and leaves the schema untouched.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const schema = this.shouldApplyStrict(this.schema) ? this.schema.strict() : this.schema;
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Error de validación',
        errors: this.formatErrors(result.error),
      });
    }
    return result.data;
  }

  private shouldApplyStrict(schema: ZodSchema): schema is ZodObject<never> {
    if (!(schema instanceof ZodObject)) return false;
    // Respect explicit `.passthrough()` / `.strict()` — only upgrade the default `'strip'`.
    const unknownKeys = (schema._def as { unknownKeys?: string }).unknownKeys;
    return unknownKeys === 'strip' || unknownKeys === undefined;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    return error.flatten().fieldErrors as Record<string, string[]>;
  }
}
