/**
 * Integration test: BudgetsService + BudgetsRepository + real Prisma DB.
 * Validates the full budget lifecycle without HTTP layer.
 */
import { BudgetStatus, PropertyType, UserRole } from '@epde/shared';
import { type INestApplication } from '@nestjs/common';

import { BudgetsService } from '../../src/budgets/budgets.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, createTestApp } from '../../src/test/setup';

describe('Budget Lifecycle (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let budgetsService: BudgetsService;

  let clientId: string;
  let adminId: string;
  let propertyId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    budgetsService = app.get(BudgetsService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // Seed minimal data
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin',
        role: UserRole.ADMIN,
        status: 'ACTIVE',
        passwordHash: '$2b$12$dummy',
      },
    });
    adminId = admin.id;

    const client = await prisma.user.create({
      data: {
        email: 'client@test.com',
        name: 'Client',
        role: UserRole.CLIENT,
        status: 'ACTIVE',
        passwordHash: '$2b$12$dummy',
      },
    });
    clientId = client.id;

    const property = await prisma.property.create({
      data: {
        name: 'Test House',
        address: 'Av. Test 123',
        city: 'Buenos Aires',
        province: 'CABA',
        type: PropertyType.HOUSE,
        userId: clientId,
        createdBy: adminId,
      },
    });
    propertyId = property.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('should create a budget request for a property', async () => {
    const user = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;

    const result = await budgetsService.create(
      {
        propertyId,
        title: 'Budget for roof repair',
        description: 'Need roof inspection and repair',
      },
      user,
    );

    expect(result).toBeDefined();
    expect(result.status).toBe(BudgetStatus.PENDING);
    expect(result.propertyId).toBe(propertyId);
  });

  it('should list budgets filtered by property', async () => {
    const user = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;

    await budgetsService.create({ propertyId, title: 'Budget 1', description: 'Desc' }, user);
    await budgetsService.create({ propertyId, title: 'Budget 2', description: 'Desc' }, user);

    const result = await budgetsService.findAll({ propertyId, take: 10 }, user);

    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.propertyId).toBe(propertyId);
  });

  it('should enforce ownership — client cannot see other clients budgets', async () => {
    const otherClient = await prisma.user.create({
      data: {
        email: 'other@test.com',
        name: 'Other',
        role: UserRole.CLIENT,
        status: 'ACTIVE',
        passwordHash: '$2b$12$dummy',
      },
    });

    const user = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;
    await budgetsService.create({ propertyId, title: 'My Budget', description: 'Desc' }, user);

    const otherUser = {
      id: otherClient.id,
      email: 'other@test.com',
      role: UserRole.CLIENT,
    } as any;
    const result = await budgetsService.findAll({ take: 10 }, otherUser);

    expect(result.data).toHaveLength(0);
  });
});
