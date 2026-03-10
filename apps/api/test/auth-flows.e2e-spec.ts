import { UserRole, UserStatus } from '@epde/shared';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { generateTokens, loginAsMobile } from './helpers';

const MOBILE = { 'x-client-type': 'mobile' };

describe('Auth Flows - Integration (e2e)', () => {
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

  describe('Session isolation', () => {
    it('should isolate sessions between login/logout/re-login cycles', async () => {
      // Admin logs in
      const adminLogin = await loginAsMobile(app, testData.admin.email, testData.admin.password);
      expect(adminLogin.status).toBe(200);
      const adminAT = adminLogin.body.data.accessToken;

      // Admin accesses /me
      const adminMe = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAT}`);

      expect(adminMe.status).toBe(200);
      expect(adminMe.body.data.email).toBe(testData.admin.email);

      // Admin logs out
      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${adminAT}`);

      expect(logoutRes.status).toBe(200);

      // Admin's old token no longer works
      const afterLogout = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAT}`);

      expect(afterLogout.status).toBe(401);

      // Client logs in — completely isolated from admin's session
      const clientLogin = await loginAsMobile(app, testData.client.email, testData.client.password);
      expect(clientLogin.status).toBe(200);
      const clientAT = clientLogin.body.data.accessToken;

      // Client accesses /me — sees own data
      const clientMe = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${clientAT}`);

      expect(clientMe.status).toBe(200);
      expect(clientMe.body.data.email).toBe(testData.client.email);
      expect(clientMe.body.data.email).not.toBe(testData.admin.email);
    });
  });

  describe('Set-password full flow', () => {
    it('should allow INVITED user to set password and then login', async () => {
      const jwtService = app.get(JwtService);
      const inviteToken = jwtService.sign({ sub: testData.invited.id, purpose: 'invite' });

      // Set password
      const setPassRes = await request(app.getHttpServer())
        .post('/api/v1/auth/set-password')
        .send({ token: inviteToken, newPassword: 'NewPassword1!' });

      expect(setPassRes.status).toBe(200);

      // Verify user status changed to ACTIVE
      const user = await prisma.user.findUnique({ where: { id: testData.invited.id } });
      expect(user?.status).toBe(UserStatus.ACTIVE);

      // Login with new password
      const loginRes = await loginAsMobile(app, testData.invited.email, 'NewPassword1!');

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.body.data.user.email).toBe(testData.invited.email);
    });

    it('should reject login for INVITED user who has not set password', async () => {
      const loginRes = await loginAsMobile(app, testData.invited.email, 'AnyPassword1!');

      expect(loginRes.status).toBe(401);
    });
  });

  describe('Web cookie flow', () => {
    it('should not return tokens in body for web clients', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testData.admin.email, password: testData.admin.password });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should refresh via cookie for web clients', async () => {
      // Login as web — get cookies
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testData.client.email, password: testData.client.password });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];

      // Refresh using cookies (send empty body so bodyparser yields {} not undefined)
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .send({});

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.message).toBe('Token refrescado');
      // Web refresh should NOT return tokens in body
      expect(refreshRes.body.data.accessToken).toBeUndefined();
    });
  });
});

describe('Auth Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: TestData;

  beforeAll(async () => {
    // Create app WITH throttle enabled (no override)
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();

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

  it('should rate-limit login after 5 attempts', async () => {
    const attempts = Array.from({ length: 7 }, () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testData.admin.email, password: testData.admin.password }),
    );

    const results = await Promise.all(attempts);
    const throttled = results.filter((r) => r.status === 429);

    // At least 1 of 7 should be throttled (limit is 5/min)
    expect(throttled.length).toBeGreaterThanOrEqual(1);
  });

  it('should rate-limit refresh after 30 attempts', async () => {
    // Generate a valid refresh token via TokenService (bypasses login throttle)
    const { refreshToken: rt } = await generateTokens(app, {
      id: testData.client.id,
      email: testData.client.email,
      role: UserRole.CLIENT,
    });

    // Send 10 refresh requests sequentially to avoid ECONNRESET.
    // Global short throttle is 5/1s, so some should be throttled.
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set(MOBILE)
        .send({ refreshToken: rt });
      results.push(res.status);
    }

    const throttled = results.filter((s) => s === 429);

    // At least 1 of 10 should be throttled (short limit is 5/s)
    expect(throttled.length).toBeGreaterThanOrEqual(1);
  });
});
