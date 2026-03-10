import { UserRole } from '@epde/shared';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { UploadService } from '../src/upload/upload.service';
import { getToken } from './helpers';

describe('UploadController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: TestData;
  let adminToken: string;
  let clientToken: string;
  let uploadSpy: jest.SpyInstance;

  // Minimal valid JPEG (JFIF magic bytes + enough data to pass file-type detection)
  const JPEG_MAGIC = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00,
  ]);

  // Minimal valid PNG (8-byte signature + IHDR chunk)
  const PNG_MAGIC = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde,
  ]);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    // Spy on UploadService.uploadFile to avoid R2 dependency
    const uploadService = app.get(UploadService);
    uploadSpy = jest
      .spyOn(uploadService, 'uploadFile')
      .mockResolvedValue('https://cdn.test/fake-url.jpg');
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
    adminToken = await getToken(app, {
      id: testData.admin.id,
      email: testData.admin.email,
      role: UserRole.ADMIN,
    });
    clientToken = await getToken(app, {
      id: testData.client.id,
      email: testData.client.email,
      role: UserRole.CLIENT,
    });
    uploadSpy.mockClear();
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('should upload a valid JPEG as admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', JPEG_MAGIC, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .field('folder', 'uploads');

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBe('https://cdn.test/fake-url.jpg');
    expect(uploadSpy).toHaveBeenCalledTimes(1);
  });

  it('should upload a valid PNG as client', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${clientToken}`)
      .attach('file', PNG_MAGIC, { filename: 'photo.png', contentType: 'image/png' })
      .field('folder', 'service-requests');

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBeDefined();
  });

  it('should reject unauthenticated upload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .attach('file', JPEG_MAGIC, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .field('folder', 'uploads');

    expect(res.status).toBe(401);
  });

  it('should reject when no file is provided', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('folder', 'uploads');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Archivo requerido');
  });

  it('should reject invalid MIME type', async () => {
    const textBuffer = Buffer.from('just plain text content');

    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', textBuffer, { filename: 'notes.txt', contentType: 'text/plain' })
      .field('folder', 'uploads');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Tipo de archivo no permitido');
  });

  it('should reject invalid folder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', JPEG_MAGIC, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .field('folder', 'hacked');

    expect(res.status).toBe(400);
  });

  it('should reject file with mismatched content (text disguised as JPEG)', async () => {
    const fakeJpeg = Buffer.from('this is not a real image');

    const res = await request(app.getHttpServer())
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', fakeJpeg, { filename: 'fake.jpg', contentType: 'image/jpeg' })
      .field('folder', 'uploads');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('contenido del archivo no coincide');
  });

  it('should accept all allowed folders', async () => {
    const folders = ['uploads', 'properties', 'tasks', 'service-requests', 'budgets'];

    for (const folder of folders) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', JPEG_MAGIC, { filename: 'test.jpg', contentType: 'image/jpeg' })
        .field('folder', folder);

      expect(res.status).toBe(201);
    }

    expect(uploadSpy).toHaveBeenCalledTimes(folders.length);
  });
});
