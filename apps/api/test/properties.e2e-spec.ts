import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { getToken } from './helpers';

describe('PropertiesController (e2e)', () => {
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

  describe('GET /api/v1/properties', () => {
    it('should list properties for client (own properties only)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      // listProperties returns paginated result directly: { data, nextCursor, hasMore, total }
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(testData.property.id);
    });

    it('should list all properties for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/properties');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/properties/:id', () => {
    it('should return property details for owner', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/properties/${testData.property.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testData.property.id);
      expect(res.body.data.address).toBe('Av. Test 123');
      expect(res.body.data.city).toBe('Buenos Aires');
    });

    it('should return property details for admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/properties/${testData.property.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testData.property.id);
    });
  });

  describe('POST /api/v1/properties (admin only)', () => {
    it('should create a property as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testData.client.id,
          address: 'Calle Nueva 456',
          city: 'Córdoba',
          type: 'APARTMENT',
          yearBuilt: 2020,
          squareMeters: 85,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.address).toBe('Calle Nueva 456');
      expect(res.body.data.city).toBe('Córdoba');
      expect(res.body.data.type).toBe('APARTMENT');
    });

    it('should reject property creation by client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          userId: testData.client.id,
          address: 'Calle Prohibida 789',
          city: 'Rosario',
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: testData.client.id });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/properties/:id', () => {
    it('should update property as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/properties/${testData.property.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'Av. Actualizada 999' });

      expect(res.status).toBe(200);
      expect(res.body.data.address).toBe('Av. Actualizada 999');
    });
  });

  describe('DELETE /api/v1/properties/:id (soft delete)', () => {
    it('should soft delete a property as admin', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/properties/${testData.property.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Property should no longer appear in listings
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.data.find((p: { id: string }) => p.id === testData.property.id);
      expect(found).toBeUndefined();
    });

    it('should reject deletion by client', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/properties/${testData.property.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Pagination', () => {
    it('should paginate property results', async () => {
      // Create additional properties
      for (let i = 0; i < 3; i++) {
        await prisma.property.create({
          data: {
            userId: testData.client.id,
            address: `Calle Paginación ${i}`,
            city: 'Buenos Aires',
            type: 'HOUSE',
          },
        });
      }

      // First page with small take
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/properties?take=2')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.hasMore).toBe(true);

      // Second page using cursor
      const cursor = page1.body.nextCursor;
      const page2 = await request(app.getHttpServer())
        .get(`/api/v1/properties?take=2&cursor=${cursor}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(page2.status).toBe(200);
      expect(page2.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
