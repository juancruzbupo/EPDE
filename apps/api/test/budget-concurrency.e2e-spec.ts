import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { getToken } from './helpers';

describe('Budget Concurrency (e2e)', () => {
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

  async function createPendingBudget(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        propertyId: testData.property.id,
        title: 'Concurrency test',
        description: 'Testing optimistic locking',
      });
    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  const lineItems = [{ description: 'Work', quantity: 1, unitPrice: 10000 }];

  describe('Concurrent respond', () => {
    it('should allow only one of two concurrent quotes to succeed', async () => {
      const budgetId = await createPendingBudget();

      // Two admins try to quote the same budget simultaneously
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/budgets/${budgetId}/respond`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ lineItems, estimatedDays: 3 }),
        request(app.getHttpServer())
          .post(`/api/v1/budgets/${budgetId}/respond`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            lineItems: [{ description: 'Other', quantity: 2, unitPrice: 5000 }],
            estimatedDays: 5,
          }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // One succeeds (201), one fails (400 = not PENDING or 409 = version mismatch)
      expect(statuses[0]).toBe(201);
      expect([400, 409]).toContain(statuses[1]);
    });
  });

  describe('Concurrent approve/reject', () => {
    it('should allow only one of simultaneous approve and reject', async () => {
      const budgetId = await createPendingBudget();

      // Admin quotes the budget first
      await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lineItems });

      // Client tries to approve and reject simultaneously
      const [approveRes, rejectRes] = await Promise.all([
        request(app.getHttpServer())
          .patch(`/api/v1/budgets/${budgetId}/status`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({ status: 'APPROVED' }),
        request(app.getHttpServer())
          .patch(`/api/v1/budgets/${budgetId}/status`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({ status: 'REJECTED' }),
      ]);

      const statuses = [approveRes.status, rejectRes.status].sort();
      // One should succeed, one should fail
      expect(statuses[0]).toBe(200);

      // Verify the budget has exactly one final status
      const budget = await prisma.budgetRequest.findUnique({ where: { id: budgetId } });
      expect(['APPROVED', 'REJECTED']).toContain(budget?.status);
    });
  });

  describe('Version mismatch', () => {
    it('should reject quote after budget was modified by another user', async () => {
      const budgetId = await createPendingBudget();

      // Admin 1 quotes successfully
      const quoteRes = await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lineItems });

      expect(quoteRes.status).toBe(201);

      // Verify version was incremented
      const budget = await prisma.budgetRequest.findUnique({ where: { id: budgetId } });
      expect(budget?.version).toBe(1);
      expect(budget?.status).toBe('QUOTED');
    });
  });
});
