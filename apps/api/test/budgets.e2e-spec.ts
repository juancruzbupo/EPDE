import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { getToken } from './helpers';

describe('Budgets - Audit & Decimal (e2e)', () => {
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

  describe('Decimal precision in budget amounts', () => {
    it('should calculate line item subtotals with correct precision', async () => {
      // Create a budget
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Precision test',
          description: 'Testing decimal precision',
        });

      expect(createRes.status).toBe(201);
      const budgetId = createRes.body.data.id;

      // Admin quotes with decimal values
      const quoteRes = await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            { description: 'Item A', quantity: 3, unitPrice: 33.33 },
            { description: 'Item B', quantity: 1, unitPrice: 0.01 },
          ],
          estimatedDays: 2,
        });

      expect(quoteRes.status).toBe(201);

      // Fetch the budget to verify amounts
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(getRes.status).toBe(200);

      const lineItems = getRes.body.data.lineItems;
      expect(lineItems).toHaveLength(2);

      // Verify total is properly calculated
      const response = getRes.body.data.response;
      expect(response).toBeDefined();
      expect(Number(response.totalAmount)).toBeCloseTo(99.99 + 0.01, 2);
    });
  });

  describe('Audit trail - updatedBy field', () => {
    it('should record updatedBy when client approves budget', async () => {
      // Create budget
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Audit test',
        });

      const budgetId = createRes.body.data.id;

      // Admin quotes
      await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [{ description: 'Work', quantity: 1, unitPrice: 10000 }],
        });

      // Client approves
      await request(app.getHttpServer())
        .patch(`/api/v1/budgets/${budgetId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'APPROVED' });

      // Verify updatedBy is set in the database
      const budget = await prisma.budgetRequest.findUnique({
        where: { id: budgetId },
      });

      expect(budget?.updatedBy).toBe(testData.client.id);
    });
  });
});
