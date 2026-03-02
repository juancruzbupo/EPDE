import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { cuidSchema } from '@epde/shared';

@Injectable()
export class ParseCuidPipe implements PipeTransform {
  transform(value: string): string {
    const result = cuidSchema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException('ID inválido');
    }
    return result.data;
  }
}
