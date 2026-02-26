import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../test/setup';
import { seedTestData, TestData } from '../test/seed-test-data';

const MOBILE = { 'x-client-type': 'mobile' };

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: TestData;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set(MOBILE)
        .send({ email: testData.admin.email, password: testData.admin.password });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testData.admin.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testData.admin.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'Test1234!' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set(MOBILE)
        .send({ email: testData.admin.email, password: testData.admin.password });

      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh without token', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/refresh').set(MOBILE);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set(MOBILE)
        .send({ email: testData.client.email, password: testData.client.password });

      const token = loginRes.body.data.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testData.client.email);
      expect(res.body.data.role).toBe('CLIENT');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });
});
