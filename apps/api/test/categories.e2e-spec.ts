import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: TestData;
  let clientToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
    clientToken = await getToken(app, {
      id: testData.client.id,
      email: testData.client.email,
      role: 'CLIENT',
    });
    adminToken = await getToken(app, {
      id: testData.admin.id,
      email: testData.admin.email,
      role: 'ADMIN',
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('GET /api/v1/categories', () => {
    it('should list categories for client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should list categories for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should create a category as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Plomería', description: 'Categoría de plomería' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Plomería');
      expect(res.body.message).toBe('Categoría creada');
    });

    it('should reject category creation by client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Electricidad' });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('should update a category as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${testData.category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Categoría Actualizada' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Categoría Actualizada');
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/categories/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
    });

    it('should reject update by client', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${testData.category.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Hack' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete a category as admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${testData.category.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject deletion by client', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${testData.category.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });
});
