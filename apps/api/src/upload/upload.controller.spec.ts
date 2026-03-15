import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

const mockFileTypeFromBuffer = jest.fn();

jest.mock(
  'file-type',
  () => ({
    __esModule: true,
    fileTypeFromBuffer: (...args: unknown[]) => mockFileTypeFromBuffer(...args),
  }),
  { virtual: true },
);

const mockUploadService = {
  uploadFile: jest.fn(),
};

function makeFile(overrides: Record<string, unknown> = {}) {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  } as Express.Multer.File;
}

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully and return url in data envelope', async () => {
      const file = makeFile();
      mockFileTypeFromBuffer.mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockUploadService.uploadFile.mockResolvedValue('https://cdn.epde.ar/uploads/photo.jpg');

      const result = await controller.uploadFile(file, { folder: 'uploads' });

      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(file, 'uploads', 'image/jpeg');
      expect(result).toEqual({ data: { url: 'https://cdn.epde.ar/uploads/photo.jpg' } });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.uploadFile(undefined as any, { folder: 'uploads' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when file mimetype is not allowed', async () => {
      const file = makeFile({ mimetype: 'application/zip' });

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include the rejected mimetype in the error message', async () => {
      const file = makeFile({ mimetype: 'application/zip' });

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        /application\/zip/,
      );
    });

    it('should throw BadRequestException when file exceeds max size', async () => {
      const file = makeFile({ size: 11 * 1024 * 1024 });

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        'El archivo excede el tamaño máximo de 10 MB',
      );
    });

    it('should throw BadRequestException when magic bytes detection returns null', async () => {
      const file = makeFile();
      mockFileTypeFromBuffer.mockResolvedValue(undefined);

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        'El contenido del archivo no coincide con un tipo permitido',
      );
    });

    it('should throw BadRequestException when detected mime does not match allowed types', async () => {
      const file = makeFile();
      mockFileTypeFromBuffer.mockResolvedValue({ mime: 'application/x-executable', ext: 'exe' });

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        'El contenido del archivo no coincide con un tipo permitido',
      );
    });

    it('should use detected mime (not client mimetype) when calling uploadService', async () => {
      const file = makeFile({ mimetype: 'image/png' });
      mockFileTypeFromBuffer.mockResolvedValue({ mime: 'image/png', ext: 'png' });
      mockUploadService.uploadFile.mockResolvedValue('https://cdn.epde.ar/uploads/img.png');

      await controller.uploadFile(file, { folder: 'properties' });

      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(file, 'properties', 'image/png');
    });

    it('should accept PDF files with valid magic bytes', async () => {
      const file = makeFile({ mimetype: 'application/pdf', originalname: 'report.pdf' });
      mockFileTypeFromBuffer.mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' });
      mockUploadService.uploadFile.mockResolvedValue('https://cdn.epde.ar/uploads/report.pdf');

      const result = await controller.uploadFile(file, { folder: 'tasks' });

      expect(result).toEqual({ data: { url: 'https://cdn.epde.ar/uploads/report.pdf' } });
    });

    it('should propagate service errors from uploadService', async () => {
      const file = makeFile();
      mockFileTypeFromBuffer.mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockUploadService.uploadFile.mockRejectedValue(new Error('R2 upload failed'));

      await expect(controller.uploadFile(file, { folder: 'uploads' })).rejects.toThrow(
        'R2 upload failed',
      );
    });
  });
});
