import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { UserRole } from '@epde/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UploadService } from './upload.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FOLDERS = ['uploads', 'properties', 'tasks', 'service-requests', 'budgets'] as const;

const uploadBodySchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS, {
    errorMap: () => ({
      message: `Carpeta no permitida. Permitidas: ${ALLOWED_FOLDERS.join(', ')}`,
    }),
  }),
});

@ApiTags('Upload')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(uploadBodySchema)) body: { folder: string },
  ) {
    const { folder } = body;
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10 MB');
    }

    // Validate actual file content via magic bytes — don't trust client Content-Type
    // Dynamic import: file-type is ESM-only
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw new BadRequestException('El contenido del archivo no coincide con un tipo permitido');
    }

    const url = await this.uploadService.uploadFile(file, folder, detected.mime);
    return { data: { url } };
  }
}
