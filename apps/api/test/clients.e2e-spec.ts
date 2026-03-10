import { UserRole } from '@epde/shared';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('ClientsController (e2e)', () => {
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
      role: UserRole.CLIENT,
    });
    adminToken = await getToken(app, {
      id: testData.admin.id,
      email: testData.admin.email,
      role: UserRole.ADMIN,
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('GET /api/v1/clients', () => {
    it('should list clients as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject listing by client role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/clients');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/clients', () => {
    it('should create a client as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'new-client@test.com', name: 'Nuevo Cliente' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('new-client@test.com');
      expect(res.body.message).toBe('Cliente creado e invitación enviada');
    });

    it('should reject creation by client role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ email: 'hack@test.com', name: 'Hacker' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/clients/:id', () => {
    it('should update a client as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/clients/${testData.client.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente Actualizado' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Cliente Actualizado');
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/clients/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/clients/:id', () => {
    it('should delete a client as admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/clients/${testData.client.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject deletion by client role', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/clients/${testData.client.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });
});
