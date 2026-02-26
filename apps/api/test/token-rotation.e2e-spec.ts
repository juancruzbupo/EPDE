import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { generateTokens, loginAsMobile } from './helpers';

const MOBILE = { 'x-client-type': 'mobile' };

describe('Token Rotation - Advanced (e2e)', () => {
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

  describe('Concurrent rotation', () => {
    it('should allow only one of multiple concurrent refreshes to succeed', async () => {
      const loginRes = await loginAsMobile(app, testData.client.email, testData.client.password);
      const rt = loginRes.body.data.refreshToken;

      // Send 5 concurrent refresh requests with the same token
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set(MOBILE)
            .send({ refreshToken: rt }),
        ),
      );

      const successes = results.filter((r) => r.status === 200);
      const failures = results.filter((r) => r.status === 401);

      // Exactly 1 should succeed (won the atomic race), rest fail
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(4);
    });
  });

  describe('Cross-user isolation', () => {
    it('should not affect other users when one family is revoked', async () => {
      // Client logs in — gets family A
      const clientLogin = await loginAsMobile(app, testData.client.email, testData.client.password);
      const clientRT = clientLogin.body.data.refreshToken;

      // Admin logs in — gets family B
      const adminLogin = await loginAsMobile(app, testData.admin.email, testData.admin.password);
      const adminRT = adminLogin.body.data.refreshToken;

      // Rotate client's token
      const refresh1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: clientRT });
      expect(refresh1.status).toBe(200);

      // Trigger reuse attack on client's OLD token (revokes client family)
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: clientRT });

      // Admin's family should still work
      const adminRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: adminRT });

      expect(adminRefresh.status).toBe(200);
      expect(adminRefresh.body.data.accessToken).toBeDefined();
    });
  });

  describe('Expired family', () => {
    it('should return 401 when refresh token family is manually revoked', async () => {
      const { refreshToken } = await generateTokens(app, {
        id: testData.client.id,
        email: testData.client.email,
        role: 'CLIENT',
      });

      // Manually revoke the family via Redis (simulates TTL expiry)
      const { TokenService } = await import('../src/auth/token.service');
      const tokenService = app.get(TokenService);
      const { JwtService } = await import('@nestjs/jwt');
      const jwtService = app.get(JwtService);
      const payload = jwtService.decode(refreshToken) as { family: string };
      await tokenService.revokeFamily(payload.family);

      // Refresh should fail
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });
});
