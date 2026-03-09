import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('CategoryTemplatesController (e2e)', () => {
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

  describe('GET /api/v1/category-templates', () => {
    it('should list category templates as admin', async () => {
      await prisma.categoryTemplate.create({
        data: { name: 'Electricidad', displayOrder: 1 },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/category-templates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject listing by client role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/category-templates')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/category-templates', () => {
    it('should create a category template as admin', async () => {
      const uniqueName = `Plomería-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/category-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: uniqueName, description: 'Tareas de plomería' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(uniqueName);
      expect(res.body.message).toBe('Categoría template creada');
    });

    it('should reject creation by client role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/category-templates')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Hack Template' });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/category-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/category-templates/:id', () => {
    it('should update a category template as admin', async () => {
      const uniqueName = `Original-${Date.now()}`;
      const template = await prisma.categoryTemplate.create({
        data: { name: uniqueName, displayOrder: 1 },
      });

      const updatedName = `Actualizada-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/category-templates/${template.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(updatedName);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/category-templates/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/category-templates/:id', () => {
    it('should delete a category template as admin', async () => {
      const template = await prisma.categoryTemplate.create({
        data: { name: 'To Delete', displayOrder: 1 },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/category-templates/${template.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject deletion by client role', async () => {
      const template = await prisma.categoryTemplate.create({
        data: { name: 'Protected', displayOrder: 1 },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/category-templates/${template.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/category-templates/reorder/batch', () => {
    it('should reorder templates as admin', async () => {
      const t1 = await prisma.categoryTemplate.create({
        data: { name: 'Template A', displayOrder: 1 },
      });
      const t2 = await prisma.categoryTemplate.create({
        data: { name: 'Template B', displayOrder: 2 },
      });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/category-templates/reorder/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [t2.id, t1.id] });

      expect(res.status).toBe(200);
    });
  });
});
