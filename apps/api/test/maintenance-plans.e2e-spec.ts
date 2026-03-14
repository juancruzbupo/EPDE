import {
  PlanStatus,
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
  UserStatus,
} from '@epde/shared';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { seedTestData, TestData } from '../src/test/seed-test-data';
import { cleanDatabase, createTestApp } from '../src/test/setup';

describe('MaintenancePlansController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: TestData;

  /** JWT tokens signed directly — avoids HTTP login throttle limit */
  let adminToken: string;
  let clientToken: string;

  /** IDs of seeded records */
  let planId: string;
  let taskId: string;
  let otherPlanId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);

    // Generate tokens via JwtService.sign() directly (not helpers.getToken()) because
    // TokenService requires Redis. JwtService.sign() is synchronous and sufficient for auth.
    adminToken = jwtService.sign({
      sub: testData.admin.id,
      email: testData.admin.email,
      role: UserRole.ADMIN,
      jti: randomUUID(),
    });
    clientToken = jwtService.sign({
      sub: testData.client.id,
      email: testData.client.email,
      role: UserRole.CLIENT,
      jti: randomUUID(),
    });

    // Create a second client to test cross-user authorization
    const otherClient = await prisma.user.create({
      data: {
        email: 'other-client@test.com',
        name: 'Other Client',
        passwordHash: 'irrelevant',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      },
    });

    const otherProperty = await prisma.property.create({
      data: {
        userId: otherClient.id,
        address: 'Otra Dirección 456',
        city: 'Córdoba',
        type: 'APARTMENT',
      },
    });

    // Seed a maintenance plan for client's property
    const plan = await prisma.maintenancePlan.create({
      data: {
        name: 'Plan Test',
        propertyId: testData.property.id,
        status: PlanStatus.ACTIVE,
      },
    });
    planId = plan.id;

    // Seed a plan for the OTHER client's property
    const otherPlan = await prisma.maintenancePlan.create({
      data: {
        name: 'Plan otro cliente',
        propertyId: otherProperty.id,
        status: PlanStatus.ACTIVE,
      },
    });
    otherPlanId = otherPlan.id;

    // Seed a task on the client's plan
    const task = await prisma.task.create({
      data: {
        maintenancePlanId: planId,
        categoryId: testData.category.id,
        name: 'Inspección de cañerías',
        status: TaskStatus.PENDING,
        recurrenceType: RecurrenceType.ANNUAL,
        recurrenceMonths: 12,
        priority: TaskPriority.MEDIUM,
        taskType: TaskType.INSPECTION,
        professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
        order: 0,
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/maintenance-plans
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/maintenance-plans', () => {
    it('ADMIN should see all plans', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // planId + otherPlanId
    });

    it('CLIENT should only see their own plans', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const ids = (res.body.data as { id: string }[]).map((p) => p.id);
      expect(ids).toContain(planId);
      expect(ids).not.toContain(otherPlanId);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/maintenance-plans');
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/maintenance-plans/:id
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/maintenance-plans/:id', () => {
    it('CLIENT should access their own plan', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${planId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(planId);
    });

    it("CLIENT should get 403 when accessing another user's plan", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${otherPlanId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should get 404 for non-existent plan', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/maintenance-plans/tasks
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/maintenance-plans/tasks', () => {
    it('ADMIN should see all tasks', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('CLIENT should only see tasks from their own plans', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans/tasks')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      const ids = (res.body.data as { id: string }[]).map((t) => t.id);
      expect(ids).toContain(taskId);
    });

    it('should handle non-numeric take param gracefully (no 500)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/maintenance-plans/tasks?take=abc')
        .set('Authorization', `Bearer ${adminToken}`);

      // Zod coerce.number() on "abc" → NaN → fails .int() → 400
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/maintenance-plans/:id/tasks/:taskId
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/maintenance-plans/:id/tasks/:taskId', () => {
    it('CLIENT should access their own task detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskId);
    });

    it("CLIENT should get 403 when accessing another user's task", async () => {
      // Create a task on the other plan
      const otherTask = await prisma.task.create({
        data: {
          maintenancePlanId: otherPlanId,
          categoryId: testData.category.id,
          name: 'Tarea de otro cliente',
          status: TaskStatus.PENDING,
          recurrenceType: RecurrenceType.ANNUAL,
          recurrenceMonths: 12,
          priority: TaskPriority.LOW,
          taskType: TaskType.INSPECTION,
          professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
          order: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${otherPlanId}/tasks/${otherTask.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${planId}/tasks/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/maintenance-plans/:id/tasks/:taskId/complete
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/maintenance-plans/:id/tasks/:taskId/complete', () => {
    const completeDto = {
      result: 'OK',
      conditionFound: 'GOOD',
      executor: 'OWNER',
      actionTaken: 'INSPECTION_ONLY',
    };

    it('ADMIN should complete a task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(completeDto);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Tarea completada');
      expect(res.body.data.log).toBeDefined();
    });

    it('should reject completing an already-COMPLETED task (400)', async () => {
      // Create a task that is already COMPLETED (not completable)
      const completedTask = await prisma.task.create({
        data: {
          maintenancePlanId: planId,
          categoryId: testData.category.id,
          name: 'Tarea ya completada',
          status: TaskStatus.COMPLETED,
          recurrenceType: RecurrenceType.ANNUAL,
          recurrenceMonths: 12,
          priority: TaskPriority.LOW,
          taskType: TaskType.INSPECTION,
          professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
          order: 1,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${planId}/tasks/${completedTask.id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(completeDto);

      expect(res.status).toBe(400);
    });

    it("CLIENT should get 403 when completing another user's task", async () => {
      const otherTask = await prisma.task.create({
        data: {
          maintenancePlanId: otherPlanId,
          categoryId: testData.category.id,
          name: 'Tarea otro',
          status: TaskStatus.PENDING,
          recurrenceType: RecurrenceType.ANNUAL,
          recurrenceMonths: 12,
          priority: TaskPriority.LOW,
          taskType: TaskType.INSPECTION,
          professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
          order: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${otherPlanId}/tasks/${otherTask.id}/complete`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(completeDto);

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/maintenance-plans/:id/tasks/:taskId/logs
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/maintenance-plans/:id/tasks/:taskId/logs', () => {
    it('should return empty logs for a new task', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return logs after task completion', async () => {
      // Complete the task to generate a log
      await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          result: 'OK',
          conditionFound: 'GOOD',
          executor: 'OWNER',
          actionTaken: 'INSPECTION_ONLY',
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].result).toBe('OK');
    });

    it("CLIENT should get 403 when accessing another user's task logs", async () => {
      const otherTask = await prisma.task.create({
        data: {
          maintenancePlanId: otherPlanId,
          categoryId: testData.category.id,
          name: 'Tarea otro',
          status: TaskStatus.PENDING,
          recurrenceType: RecurrenceType.ANNUAL,
          recurrenceMonths: 12,
          priority: TaskPriority.LOW,
          taskType: TaskType.INSPECTION,
          professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
          order: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/maintenance-plans/${otherPlanId}/tasks/${otherTask.id}/logs`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/maintenance-plans/:id/tasks/:taskId/notes
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/maintenance-plans/:id/tasks/:taskId/notes', () => {
    it('ADMIN should add a note to any task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${planId}/tasks/${taskId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Nota de prueba desde admin' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Nota agregada');
      expect(res.body.data.content).toBe('Nota de prueba desde admin');
    });

    it("CLIENT should get 403 when adding note to another user's task", async () => {
      const otherTask = await prisma.task.create({
        data: {
          maintenancePlanId: otherPlanId,
          categoryId: testData.category.id,
          name: 'Tarea otro',
          status: TaskStatus.PENDING,
          recurrenceType: RecurrenceType.ANNUAL,
          recurrenceMonths: 12,
          priority: TaskPriority.LOW,
          taskType: TaskType.INSPECTION,
          professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
          order: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/maintenance-plans/${otherPlanId}/tasks/${otherTask.id}/notes`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ content: 'Intento no autorizado' });

      expect(res.status).toBe(403);
    });
  });
});
