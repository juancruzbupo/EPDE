/**
 * Integration test: ServiceRequestsService + ServiceRequestsRepository + real Prisma DB.
 * Validates the service request state machine and ownership enforcement.
 */
import { PropertyType, ServiceStatus, ServiceUrgency, UserRole } from '@epde/shared';
import { BadRequestException, type INestApplication } from '@nestjs/common';

import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceRequestsService } from '../../src/service-requests/service-requests.service';
import { cleanDatabase, createTestApp } from '../../src/test/setup';

describe('Service Request Flow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serviceRequestsService: ServiceRequestsService;

  let adminId: string;
  let clientId: string;
  let propertyId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    serviceRequestsService = app.get(ServiceRequestsService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

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

  it('should create a service request in OPEN status', async () => {
    const user = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;

    const result = await serviceRequestsService.create(
      {
        propertyId,
        title: 'Water leak in kitchen',
        description: 'There is a water leak under the sink',
        urgency: ServiceUrgency.HIGH,
      },
      user,
    );

    expect(result).toBeDefined();
    expect(result.status).toBe(ServiceStatus.OPEN);
    expect(result.urgency).toBe(ServiceUrgency.HIGH);
    expect(result.propertyId).toBe(propertyId);
  });

  it('should transition through valid status sequence', async () => {
    const clientUser = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;
    const adminUser = { id: adminId, email: 'admin@test.com', role: UserRole.ADMIN } as any;

    const sr = await serviceRequestsService.create(
      {
        propertyId,
        title: 'Fix door',
        description: 'Front door is broken',
        urgency: ServiceUrgency.MEDIUM,
      },
      clientUser,
    );

    // OPEN → IN_REVIEW
    const inReview = await serviceRequestsService.updateStatus(
      sr.id,
      { status: ServiceStatus.IN_REVIEW },
      adminUser,
    );
    expect(inReview.status).toBe(ServiceStatus.IN_REVIEW);

    // IN_REVIEW → IN_PROGRESS
    const inProgress = await serviceRequestsService.updateStatus(
      sr.id,
      { status: ServiceStatus.IN_PROGRESS },
      adminUser,
    );
    expect(inProgress.status).toBe(ServiceStatus.IN_PROGRESS);

    // IN_PROGRESS → RESOLVED
    const resolved = await serviceRequestsService.updateStatus(
      sr.id,
      { status: ServiceStatus.RESOLVED },
      adminUser,
    );
    expect(resolved.status).toBe(ServiceStatus.RESOLVED);

    // RESOLVED → CLOSED
    const closed = await serviceRequestsService.updateStatus(
      sr.id,
      { status: ServiceStatus.CLOSED },
      adminUser,
    );
    expect(closed.status).toBe(ServiceStatus.CLOSED);
  });

  it('should reject invalid status transitions', async () => {
    const clientUser = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;
    const adminUser = { id: adminId, email: 'admin@test.com', role: UserRole.ADMIN } as any;

    const sr = await serviceRequestsService.create(
      {
        propertyId,
        title: 'Fix window',
        description: 'Window is cracked',
        urgency: ServiceUrgency.LOW,
      },
      clientUser,
    );

    // OPEN → CLOSED should be rejected (must go through IN_REVIEW → IN_PROGRESS → RESOLVED first)
    await expect(
      serviceRequestsService.updateStatus(sr.id, { status: ServiceStatus.CLOSED }, adminUser),
    ).rejects.toThrow(BadRequestException);

    // OPEN → RESOLVED should be rejected
    await expect(
      serviceRequestsService.updateStatus(sr.id, { status: ServiceStatus.RESOLVED }, adminUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('should enforce ownership — client cannot see other clients requests', async () => {
    const clientUser = { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any;

    await serviceRequestsService.create(
      {
        propertyId,
        title: 'My request',
        description: 'Only mine',
        urgency: ServiceUrgency.LOW,
      },
      clientUser,
    );

    const otherClient = await prisma.user.create({
      data: {
        email: 'other@test.com',
        name: 'Other',
        role: UserRole.CLIENT,
        status: 'ACTIVE',
        passwordHash: '$2b$12$dummy',
      },
    });

    const otherUser = { id: otherClient.id, email: 'other@test.com', role: UserRole.CLIENT } as any;
    const result = await serviceRequestsService.findAll({ take: 10 }, otherUser);

    expect(result.data).toHaveLength(0);
  });
});
