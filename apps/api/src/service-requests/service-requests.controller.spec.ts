import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../test/setup';
import { seedTestData, TestData } from '../test/seed-test-data';
import { TokenService } from '../auth/token.service';

describe('ServiceRequestsController (e2e)', () => {
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

    const tokenService = app.get(TokenService);
    const clientPair = await tokenService.generateTokenPair({
      id: testData.client.id,
      email: testData.client.email,
      role: 'CLIENT',
    });
    clientToken = clientPair.accessToken;

    const adminPair = await tokenService.generateTokenPair({
      id: testData.admin.id,
      email: testData.admin.email,
      role: 'ADMIN',
    });
    adminToken = adminPair.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('Full service request lifecycle', () => {
    it('should go from OPEN → IN_REVIEW → IN_PROGRESS → RESOLVED', async () => {
      // 1. Client creates
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Caño roto en baño',
          description: 'Hay una pérdida de agua en el caño del baño principal',
          urgency: 'HIGH',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.status).toBe('OPEN');
      const requestId = createRes.body.data.id;

      // 2. Admin → IN_REVIEW
      const reviewRes = await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_REVIEW' });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.data.status).toBe('IN_REVIEW');

      // 3. Admin → IN_PROGRESS
      const progressRes = await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.status).toBe('IN_PROGRESS');

      // 4. Admin → RESOLVED
      const resolveRes = await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('RESOLVED');
    });
  });

  describe('Authorization checks', () => {
    it('should reject service request creation by admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Test request',
          description: 'This should be rejected because admin cannot create',
          urgency: 'LOW',
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/service-requests');

      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should reject a request with missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should reject a request with too short description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Test',
          description: 'Short',
        });

      expect(res.status).toBe(400);
    });
  });
});
