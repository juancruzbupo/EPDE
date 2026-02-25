import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../test/setup';
import { seedTestData, TestData } from '../test/seed-test-data';

describe('BudgetsController (e2e)', () => {
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

    const clientLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testData.client.email, password: testData.client.password });
    clientToken = clientLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testData.admin.email, password: testData.admin.password });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('Full budget lifecycle: create → quote → approve', () => {
    it('should complete the full budget cycle', async () => {
      // 1. Client creates a budget request
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Reparación de techo',
          description: 'Filtración en el techo del living',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.status).toBe('PENDING');
      const budgetId = createRes.body.data.id;

      // 2. Admin quotes the budget
      const quoteRes = await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            { description: 'Materiales', quantity: 1, unitPrice: 50000 },
            { description: 'Mano de obra', quantity: 2, unitPrice: 30000 },
          ],
          estimatedDays: 5,
          notes: 'Incluye garantía 6 meses',
        });

      expect(quoteRes.status).toBe(201);
      expect(quoteRes.body.data.status).toBe('QUOTED');

      // 3. Client approves
      const approveRes = await request(app.getHttpServer())
        .patch(`/api/v1/budgets/${budgetId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'APPROVED' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // 4. Admin moves to IN_PROGRESS
      const progressRes = await request(app.getHttpServer())
        .patch(`/api/v1/budgets/${budgetId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.status).toBe('IN_PROGRESS');

      // 5. Admin marks as COMPLETED
      const completeRes = await request(app.getHttpServer())
        .patch(`/api/v1/budgets/${budgetId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Budget rejection flow', () => {
    it('should allow client to reject a quoted budget', async () => {
      // Create
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Pintura exterior',
        });

      const budgetId = createRes.body.data.id;

      // Admin quotes
      await request(app.getHttpServer())
        .post(`/api/v1/budgets/${budgetId}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [{ description: 'Pintura', quantity: 10, unitPrice: 5000 }],
        });

      // Client rejects
      const rejectRes = await request(app.getHttpServer())
        .patch(`/api/v1/budgets/${budgetId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'REJECTED' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('REJECTED');
    });
  });

  describe('Authorization checks', () => {
    it('should reject budget creation by admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId: testData.property.id,
          title: 'Test budget',
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/budgets');

      expect(res.status).toBe(401);
    });
  });
});
