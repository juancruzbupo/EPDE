import { BCRYPT_SALT_ROUNDS, UserRole, UserStatus } from '@epde/shared';
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { TokenService } from '../src/auth/token.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createTestApp } from '../src/test/setup';

describe('InspectionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let clientToken: string;
  let propertyId: string;
  let taskTemplateId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    const hash = await bcrypt.hash('Test1234!', BCRYPT_SALT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        email: 'admin-insp@test.com',
        name: 'Admin Inspector',
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const client = await prisma.user.create({
      data: {
        email: 'client-insp@test.com',
        name: 'Client Inspector',
        passwordHash: hash,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      },
    });

    const property = await prisma.property.create({
      data: {
        userId: client.id,
        address: 'Av. Inspección 456',
        city: 'Buenos Aires',
        type: 'HOUSE',
        activeSectors: ['EXTERIOR', 'ROOF', 'INTERIOR'],
      },
    });
    propertyId = property.id;

    // Create CategoryTemplate + TaskTemplate (needed for generate-plan)
    const categoryTemplate = await prisma.categoryTemplate.create({
      data: {
        name: 'Techos y Cubiertas',
        icon: '🏠',
        description: 'Inspección de techos',
        displayOrder: 0,
      },
    });

    const taskTemplate = await prisma.taskTemplate.create({
      data: {
        name: 'Revisión de membrana',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription: 'Verificar estado de membrana asfáltica',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        defaultSector: 'ROOF',
        inspectionGuide: 'Revisar visualmente el estado de la membrana',
        displayOrder: 0,
        categoryId: categoryTemplate.id,
      },
    });
    taskTemplateId = taskTemplate.id;

    const tokenService = app.get(TokenService);

    const adminPair = await tokenService.generateTokenPair({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
    });
    adminToken = adminPair.accessToken;

    const clientPair = await tokenService.generateTokenPair({
      id: client.id,
      email: client.email,
      role: UserRole.CLIENT,
    });
    clientToken = clientPair.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('Full inspection lifecycle', () => {
    let checklistId: string;
    let itemIds: string[];

    it('should create an inspection with items (admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          notes: 'Inspección inicial de la propiedad',
          items: [
            {
              sector: 'ROOF',
              name: 'Revisión de membrana',
              description: 'Verificar estado general',
              taskTemplateId,
            },
            {
              sector: 'EXTERIOR',
              name: 'Estado de pintura exterior',
              description: 'Verificar descascaramiento',
            },
            {
              sector: 'INTERIOR',
              name: 'Humedad en paredes',
              description: 'Buscar manchas de humedad',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.notes).toBe('Inspección inicial de la propiedad');

      checklistId = res.body.data.id;
      itemIds = res.body.data.items.map((i: { id: string }) => i.id);
    });

    it('should list inspections by property', async () => {
      // Create first
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item de prueba' }],
        });

      checklistId = createRes.body.data.id;
      itemIds = createRes.body.data.items.map((i: { id: string }) => i.id);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/inspections/property/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('items');
    });

    it('should get inspection by ID', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item de prueba' }],
        });

      checklistId = createRes.body.data.id;
      itemIds = createRes.body.data.items.map((i: { id: string }) => i.id);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/inspections/${checklistId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(checklistId);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data).toHaveProperty('inspector');
    });

    it('should update an item status to NEEDS_ATTENTION with finding', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item a evaluar' }],
        });

      checklistId = createRes.body.data.id;
      itemIds = createRes.body.data.items.map((i: { id: string }) => i.id);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/inspections/items/${itemIds[0]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'NEEDS_ATTENTION',
          finding: 'Se observa fisura en la membrana',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NEEDS_ATTENTION');
      expect(res.body.data.finding).toBe('Se observa fisura en la membrana');
    });

    it('should add a custom item to the checklist', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item existente' }],
        });

      checklistId = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/inspections/${checklistId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sector: 'EXTERIOR',
          name: 'Canaleta obstruida',
          description: 'Observada durante inspección',
          isCustom: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Canaleta obstruida');
      expect(res.body.data.sector).toBe('EXTERIOR');
      expect(res.body.data.isCustom).toBe(true);
    });

    it('should update notes on the checklist', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item' }],
        });

      checklistId = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/inspections/${checklistId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Propiedad en buen estado general, salvo techos' });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Propiedad en buen estado general, salvo techos');
    });

    it('should evaluate all items then generate a plan with tasks and baseline TaskLogs', async () => {
      // Create inspection with template-linked item + a plain item
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [
            {
              sector: 'ROOF',
              name: 'Revisión de membrana',
              taskTemplateId,
            },
            {
              sector: 'EXTERIOR',
              name: 'Estado de pintura exterior',
            },
          ],
        });

      expect(createRes.status).toBe(201);
      checklistId = createRes.body.data.id;
      itemIds = createRes.body.data.items.map((i: { id: string }) => i.id);

      // Evaluate ALL items (must not leave any PENDING)
      await request(app.getHttpServer())
        .patch(`/api/v1/inspections/items/${itemIds[0]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'NEEDS_ATTENTION', finding: 'Membrana agrietada' });

      await request(app.getHttpServer())
        .patch(`/api/v1/inspections/items/${itemIds[1]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OK' });

      // Generate plan
      const planRes = await request(app.getHttpServer())
        .post(`/api/v1/inspections/${checklistId}/generate-plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planName: 'Plan desde inspección' });

      expect(planRes.status).toBe(201);
      expect(planRes.body.data).toHaveProperty('id');
      expect(planRes.body.data.name).toBe('Plan desde inspección');
      expect(planRes.body.data.tasks).toHaveLength(2);
      expect(planRes.body.message).toBe('Plan de mantenimiento generado desde inspección');

      // Verify tasks have riskScore
      for (const task of planRes.body.data.tasks) {
        expect(task).toHaveProperty('riskScore');
        expect(typeof task.riskScore).toBe('number');
      }

      // The NEEDS_ATTENTION item should have HIGH priority (bumped from MEDIUM)
      const attentionTask = planRes.body.data.tasks.find(
        (t: { name: string }) => t.name === 'Revisión de membrana',
      );
      expect(attentionTask.priority).toBe('HIGH');

      // Verify baseline TaskLogs were created
      const taskLogs = await prisma.taskLog.findMany({
        where: { taskId: { in: planRes.body.data.tasks.map((t: { id: string }) => t.id) } },
      });
      expect(taskLogs).toHaveLength(2);
    });

    it('should soft delete an inspection and return 404 on GET', async () => {
      // Create a second inspection (property already has a plan from previous test,
      // so we use a fresh property for isolation)
      const secondProperty = await prisma.property.create({
        data: {
          userId: (await prisma.user.findFirst({ where: { role: 'CLIENT' } }))!.id,
          address: 'Av. Delete 789',
          city: 'Buenos Aires',
          type: 'HOUSE',
        },
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId: secondProperty.id,
          items: [{ sector: 'INTERIOR', name: 'Item a eliminar' }],
        });

      const deleteId = createRes.body.data.id;

      // Soft delete
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/inspections/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBe('Inspección eliminada');

      // Verify GET returns 404 (soft-delete middleware filters it out)
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/inspections/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('Authorization checks', () => {
    it('should reject inspection creation by client (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          propertyId,
          items: [{ sector: 'ROOF', name: 'Item no autorizado' }],
        });

      expect(res.status).toBe(403);
    });

    it('should allow client to list inspections for their own property', async () => {
      // Admin creates an inspection first
      await request(app.getHttpServer())
        .post('/api/v1/inspections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          items: [{ sector: 'EXTERIOR', name: 'Item visible para cliente' }],
        });

      // Client lists inspections for their property
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inspections/property/${propertyId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
