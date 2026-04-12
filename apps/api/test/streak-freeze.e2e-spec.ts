import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('Streak Freeze (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // Create admin + client
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: '$2b$10$test',
      },
    });
    const client = await prisma.user.create({
      data: {
        email: 'client@test.com',
        name: 'Client',
        role: 'CLIENT',
        status: 'ACTIVE',
        passwordHash: '$2b$10$test',
      },
    });

    clientToken = await getToken(app, { id: client.id, email: client.email, role: 'CLIENT' });
    adminToken = await getToken(app, { id: admin.id, email: admin.email, role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/me/streak-freeze — client can activate freeze', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/me/streak-freeze')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body.data).toEqual({ used: true });
    expect(res.body.message).toContain('freeze');
  });

  it('POST /auth/me/streak-freeze — rejects second use same month', async () => {
    // First use
    await request(app.getHttpServer())
      .post('/api/v1/auth/me/streak-freeze')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    // Second use — should fail
    await request(app.getHttpServer())
      .post('/api/v1/auth/me/streak-freeze')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(400);
  });

  it('GET /auth/me/milestones — returns empty array for new user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me/milestones')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
  });

  it('GET /auth/me/milestones — admin can also view milestones', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me/milestones')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
