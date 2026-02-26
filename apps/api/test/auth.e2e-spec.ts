import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanDatabase } from '../src/test/setup';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { generateTokens, loginAsMobile } from './helpers';

const MOBILE = { 'x-client-type': 'mobile' };

describe('Auth - Token Rotation (e2e)', () => {
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

  describe('Login - Token pair generation', () => {
    it('should return access token and refresh token for mobile clients', async () => {
      const res = await loginAsMobile(app, testData.admin.email, testData.admin.password);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testData.admin.email);
    });

    it('should set cookies for web clients', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testData.admin.email, password: testData.admin.password });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const accessCookie = cookies.find((c: string) => c.startsWith('access_token='));
      const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();
    });
  });

  describe('Refresh - Token rotation', () => {
    it('should rotate refresh token on each refresh call', async () => {
      const loginRes = await loginAsMobile(app, testData.client.email, testData.client.password);
      const rt1 = loginRes.body.data.refreshToken;

      // First refresh
      const refresh1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: rt1 });

      expect(refresh1.status).toBe(200);
      expect(refresh1.body.data.accessToken).toBeDefined();
      expect(refresh1.body.data.refreshToken).toBeDefined();
      const rt2 = refresh1.body.data.refreshToken;

      // Token should be different (rotated)
      expect(rt2).not.toBe(rt1);

      // Second refresh with new token
      const refresh2 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: rt2 });

      expect(refresh2.status).toBe(200);
      expect(refresh2.body.data.accessToken).toBeDefined();
    });

    it('should reject old refresh token after rotation (reuse detection)', async () => {
      const loginRes = await loginAsMobile(app, testData.client.email, testData.client.password);
      const oldRT = loginRes.body.data.refreshToken;

      // First refresh — rotates the token
      const refresh1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: oldRT });

      expect(refresh1.status).toBe(200);

      // Attempt reuse of OLD refresh token — should fail
      const reuseAttempt = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: oldRT });

      expect(reuseAttempt.status).toBe(401);
    });

    it('should invalidate entire family on reuse detection', async () => {
      const loginRes = await loginAsMobile(app, testData.client.email, testData.client.password);
      const oldRT = loginRes.body.data.refreshToken;

      // Rotate — get new token
      const refresh1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: oldRT });

      const newRT = refresh1.body.data.refreshToken;

      // Trigger reuse detection with old token
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: oldRT });

      // Now even the valid NEW token should be rejected (family revoked)
      const afterRevoke = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: newRT });

      expect(afterRevoke.status).toBe(401);
    });
  });

  describe('Logout - Token blacklisting', () => {
    it('should blacklist access token on logout', async () => {
      // Generate tokens directly to avoid throttle on login endpoint
      const { accessToken } = await generateTokens(app, {
        id: testData.admin.id,
        email: testData.admin.email,
        role: 'ADMIN',
      });

      // Verify token works before logout
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(200);

      // Logout
      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);

      // Token should now be blacklisted
      const afterLogout = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(afterLogout.status).toBe(401);
    });

    it('should revoke refresh token family on logout', async () => {
      const { accessToken, refreshToken } = await generateTokens(app, {
        id: testData.admin.id,
        email: testData.admin.email,
        role: 'ADMIN',
      });

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // Refresh token should no longer work (family revoked)
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('Set Password', () => {
    it('should allow INVITED user to set password', async () => {
      // Generate a valid invite token using the app's JwtService
      const jwtService = app.get(JwtService);
      const inviteToken = jwtService.sign({ sub: testData.invited.id });

      // Set password
      const setPassRes = await request(app.getHttpServer())
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, newPassword: 'NewPassword1!' });

      expect(setPassRes.status).toBe(200);
      expect(setPassRes.body.data.message).toBe('Contraseña configurada correctamente');
    });
  });
});
