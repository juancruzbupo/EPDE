import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3: S3Client | null = null;
  private bucketName: string | undefined;
  private publicUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.bucketName = this.configService.get<string>('R2_BUCKET_NAME');
      this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    } else {
      this.logger.warn('Cloudflare R2 no configurado. Upload deshabilitado.');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    verifiedMime?: string,
  ): Promise<string> {
    if (!this.s3 || !this.bucketName) {
      throw new Error('Upload no configurado. Configure las variables R2_* en .env');
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const key = `${folder}/${randomUUID()}-${safeName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: verifiedMime ?? file.mimetype,
        ContentDisposition: 'attachment',
      }),
    );

    return `${this.publicUrl}/${key}`;
  }
}
