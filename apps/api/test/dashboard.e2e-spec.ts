import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('DashboardController (e2e)', () => {
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

  describe('GET /api/v1/dashboard/stats (admin)', () => {
    it('should return admin stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should reject client access', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/dashboard/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboard/activity (admin)', () => {
    it('should return recent activity', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should reject client access', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/activity')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/client-stats', () => {
    it('should return client stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/client-stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totalProperties).toBeDefined();
    });

    it('should reject admin access', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/client-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/client-upcoming', () => {
    it('should return upcoming tasks for client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/client-upcoming')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should not expose tasks from other clients', async () => {
      // Create a second client with property, plan, and tasks
      const otherClient = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other Client',
          passwordHash: 'unused',
          role: 'CLIENT',
          status: 'ACTIVE',
        },
      });

      const otherProperty = await prisma.property.create({
        data: {
          userId: otherClient.id,
          address: 'Other Address',
          city: 'Other City',
          type: 'HOUSE',
        },
      });

      const plan = await prisma.maintenancePlan.create({
        data: {
          propertyId: otherProperty.id,
          name: 'Other Plan',
          status: 'ACTIVE',
        },
      });

      await prisma.task.create({
        data: {
          maintenancePlanId: plan.id,
          categoryId: testData.category.id,
          name: 'Secret Task',
          taskType: 'INSPECTION',
          priority: 'HIGH',
          professionalRequirement: 'PROFESSIONAL_REQUIRED',
          recurrenceType: 'ANNUAL',
          nextDueDate: new Date(Date.now() + 86400000), // tomorrow
          status: 'PENDING',
          order: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/client-upcoming')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      // Original client should not see the other client's tasks
      const taskNames = res.body.data.map((t: { name: string }) => t.name);
      expect(taskNames).not.toContain('Secret Task');
    });
  });
});
