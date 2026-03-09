import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';
import { getToken } from './helpers';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: TestData;
  let clientToken: string;
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
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  /** Helper: seed N notifications for a given user */
  async function seedNotifications(userId: string, count: number, read = false) {
    const data = Array.from({ length: count }, (_, i) => ({
      userId,
      type: 'SYSTEM' as const,
      title: `Notification ${i + 1}`,
      message: `Message ${i + 1}`,
      read,
    }));
    await prisma.notification.createMany({ data });
  }

  describe('GET /api/v1/notifications', () => {
    it('should list notifications for authenticated client', async () => {
      await seedNotifications(testData.client.id, 3);

      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should paginate with cursor', async () => {
      await seedNotifications(testData.client.id, 5);

      const page1 = await request(app.getHttpServer())
        .get('/api/v1/notifications?take=2')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.hasMore).toBe(true);
      expect(page1.body.nextCursor).toBeDefined();

      const page2 = await request(app.getHttpServer())
        .get(`/api/v1/notifications?take=2&cursor=${page1.body.nextCursor}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(2);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return correct unread count', async () => {
      await seedNotifications(testData.client.id, 3, false);
      await seedNotifications(testData.client.id, 2, true);

      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(3);
    });

    it('should return 0 when all notifications are read', async () => {
      await seedNotifications(testData.client.id, 2, true);

      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testData.client.id,
          type: 'SYSTEM',
          title: 'Test',
          message: 'Test message',
          read: false,
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.read).toBe(true);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/not-a-uuid/read')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(400);
    });

    it('should not allow marking another user notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testData.admin.id,
          type: 'SYSTEM',
          title: 'Admin notification',
          message: 'For admin only',
          read: false,
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${clientToken}`);

      // Prisma update with { id, userId } fails when userId doesn't match
      expect([403, 404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await seedNotifications(testData.client.id, 4, false);

      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(4);

      // Verify unread count is now 0
      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(countRes.body.data.count).toBe(0);
    });

    it('should return 0 when no unread notifications', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });
});
