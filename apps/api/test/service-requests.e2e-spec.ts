import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { getToken } from './helpers';

describe('ServiceRequests - Audit (e2e)', () => {
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

  describe('Audit trail - updatedBy field', () => {
    it('should record updatedBy when admin updates service request status', async () => {
      // Client creates
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Audit test SR',
          description: 'Testing audit trail for service requests',
          urgency: 'MEDIUM',
        });

      expect(createRes.status).toBe(201);
      const srId = createRes.body.data.id;

      // Admin moves to IN_REVIEW
      await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${srId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_REVIEW' });

      // Verify updatedBy is set in the database
      const sr = await prisma.serviceRequest.findUnique({
        where: { id: srId },
      });

      expect(sr?.updatedBy).toBe(testData.admin.id);
    });
  });

  describe('Full lifecycle with audit tracking', () => {
    it('should track updatedBy through status transitions', async () => {
      // Client creates
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Full lifecycle audit',
          description: 'Tracking audit through complete lifecycle',
          urgency: 'HIGH',
        });

      const srId = createRes.body.data.id;

      // Admin → IN_REVIEW
      await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${srId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_REVIEW' });

      let sr = await prisma.serviceRequest.findUnique({ where: { id: srId } });
      expect(sr?.updatedBy).toBe(testData.admin.id);

      // Admin → IN_PROGRESS
      await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${srId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' });

      sr = await prisma.serviceRequest.findUnique({ where: { id: srId } });
      expect(sr?.updatedBy).toBe(testData.admin.id);

      // Admin → RESOLVED
      await request(app.getHttpServer())
        .patch(`/api/v1/service-requests/${srId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      sr = await prisma.serviceRequest.findUnique({ where: { id: srId } });
      expect(sr?.updatedBy).toBe(testData.admin.id);
      expect(sr?.status).toBe('RESOLVED');
    });
  });
});
