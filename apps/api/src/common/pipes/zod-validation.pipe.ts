import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Error de validación',
        errors: this.formatErrors(result.error),
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    return error.flatten().fieldErrors as Record<string, string[]>;
  }
}
