import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadService } from './upload.service';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
}));

jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
}));

describe('UploadService', () => {
  let service: UploadService;
  let configService: { get: jest.Mock };

  const r2Config: Record<string, string> = {
    R2_ENDPOINT: 'https://r2.example.com',
    R2_ACCESS_KEY_ID: 'access-key',
    R2_SECRET_ACCESS_KEY: 'secret-key',
    R2_BUCKET_NAME: 'my-bucket',
    R2_PUBLIC_URL: 'https://cdn.example.com',
  };

  describe('when R2 is configured', () => {
    beforeEach(async () => {
      mockSend.mockReset();
      configService = {
        get: jest.fn((key: string) => r2Config[key]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [UploadService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get<UploadService>(UploadService);
    });

    const mockFile = {
      originalname: 'photo.jpg',
      buffer: Buffer.from('file-content'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('should initialize S3 client when all R2 vars present', () => {
      expect(configService.get).toHaveBeenCalledWith('R2_ENDPOINT');
      expect(configService.get).toHaveBeenCalledWith('R2_ACCESS_KEY_ID');
      expect(configService.get).toHaveBeenCalledWith('R2_SECRET_ACCESS_KEY');
    });

    it('should upload file and return public URL', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.uploadFile(mockFile, 'photos');

      expect(result).toBe('https://cdn.example.com/photos/test-uuid-1234-photo.jpg');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'my-bucket',
          Key: 'photos/test-uuid-1234-photo.jpg',
          Body: mockFile.buffer,
          ContentType: 'image/jpeg',
          ContentDisposition: 'attachment',
        }),
      );
    });

    it('should use verified MIME type when provided', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadFile(mockFile, 'photos', 'image/png');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/png',
        }),
      );
    });

    it('should fallback to file.mimetype when no verified MIME', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadFile(mockFile, 'photos');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should generate unique key with UUID and original name', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadFile(mockFile, 'documents');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'documents/test-uuid-1234-photo.jpg',
        }),
      );
    });

    it('should set ContentDisposition to attachment', async () => {
      mockSend.mockResolvedValue({});

      await service.uploadFile(mockFile, 'photos');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentDisposition: 'attachment',
        }),
      );
    });
  });

  describe('when R2 is NOT configured', () => {
    beforeEach(async () => {
      configService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [UploadService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get<UploadService>(UploadService);
    });

    it('should NOT initialize S3 when R2 vars missing', () => {
      // Service created without error — S3 is null internally
      expect(service).toBeDefined();
    });

    it('should throw when upload attempted without S3 configured', async () => {
      const mockFile = {
        originalname: 'photo.jpg',
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(service.uploadFile(mockFile, 'photos')).rejects.toThrow('Upload no configurado');
    });
  });
});
