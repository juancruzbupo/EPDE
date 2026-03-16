/**
 * Integration test: TaskLifecycleService + TasksRepository + real Prisma DB.
 * Validates task completion creates a TaskLog and resets status to PENDING.
 */
import {
  ActionTaken,
  ConditionFound,
  PlanStatus,
  ProfessionalRequirement,
  PropertyType,
  RecurrenceType,
  TaskExecutor,
  TaskPriority,
  TaskResult,
  TaskStatus,
  TaskType,
  UserRole,
} from '@epde/shared';
import { BadRequestException, type INestApplication } from '@nestjs/common';

import { PrismaService } from '../../src/prisma/prisma.service';
import { TaskLifecycleService } from '../../src/tasks/task-lifecycle.service';
import { cleanDatabase, createTestApp } from '../../src/test/setup';

describe('Task Completion (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let taskLifecycle: TaskLifecycleService;

  let adminId: string;
  let clientId: string;
  let planId: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    taskLifecycle = app.get(TaskLifecycleService);
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

    const plan = await prisma.maintenancePlan.create({
      data: {
        name: 'Test Plan',
        status: PlanStatus.ACTIVE,
        propertyId: property.id,
        createdBy: adminId,
      },
    });
    planId = plan.id;

    const category = await prisma.category.create({
      data: { name: 'Estructura' },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('should complete a task and reschedule to PENDING with new due date', async () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const task = await prisma.task.create({
      data: {
        name: 'Inspect roof',
        maintenancePlanId: planId,
        categoryId,
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        recurrenceType: RecurrenceType.ANNUAL,
        recurrenceMonths: 12,
        taskType: TaskType.INSPECTION,
        professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
        nextDueDate: nextMonth,
        order: 0,
      },
    });

    const result = await taskLifecycle.completeTask(
      task.id,
      adminId,
      {
        result: TaskResult.GOOD,
        conditionFound: ConditionFound.AS_EXPECTED,
        executor: TaskExecutor.PROFESSIONAL,
        actionTaken: ActionTaken.NONE,
      },
      { id: adminId, email: 'admin@test.com', role: UserRole.ADMIN } as any,
      planId,
    );

    // Task should be back to PENDING
    expect(result.task.status).toBe(TaskStatus.PENDING);

    // Due date should be rescheduled (12 months from original)
    expect(result.task.nextDueDate).not.toEqual(nextMonth);
    expect(new Date(result.task.nextDueDate!).getTime()).toBeGreaterThan(nextMonth.getTime());

    // TaskLog should be created
    expect(result.log).toBeDefined();
    expect(result.log.taskId).toBe(task.id);
    expect(result.log.completedBy).toBe(adminId);
    expect(result.log.result).toBe(TaskResult.GOOD);
  });

  it('should create a TaskLog record with completion metadata', async () => {
    const task = await prisma.task.create({
      data: {
        name: 'Check pipes',
        maintenancePlanId: planId,
        categoryId,
        status: TaskStatus.OVERDUE,
        priority: TaskPriority.MEDIUM,
        recurrenceType: RecurrenceType.SEMI_ANNUAL,
        recurrenceMonths: 6,
        taskType: TaskType.INSPECTION,
        professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
        nextDueDate: new Date('2025-01-01'),
        order: 0,
      },
    });

    await taskLifecycle.completeTask(
      task.id,
      clientId,
      {
        result: TaskResult.NEEDS_ATTENTION,
        conditionFound: ConditionFound.MINOR_ISSUE,
        executor: TaskExecutor.OWNER,
        actionTaken: ActionTaken.REPAIRED,
        note: 'Found small leak',
        cost: 5000,
      },
      { id: clientId, email: 'client@test.com', role: UserRole.CLIENT } as any,
      planId,
    );

    const logs = await prisma.taskLog.findMany({ where: { taskId: task.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]!.notes).toBe('Found small leak');
    expect(Number(logs[0]!.cost)).toBe(5000);
    expect(logs[0]!.result).toBe(TaskResult.NEEDS_ATTENTION);
  });

  it('should throw when trying to complete a non-completable task', async () => {
    const task = await prisma.task.create({
      data: {
        name: 'Already done',
        maintenancePlanId: planId,
        categoryId,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        recurrenceType: RecurrenceType.ANNUAL,
        taskType: TaskType.INSPECTION,
        professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
        order: 0,
      },
    });

    await expect(
      taskLifecycle.completeTask(
        task.id,
        adminId,
        {
          result: TaskResult.GOOD,
          conditionFound: ConditionFound.AS_EXPECTED,
          executor: TaskExecutor.PROFESSIONAL,
          actionTaken: ActionTaken.NONE,
        },
        { id: adminId, email: 'admin@test.com', role: UserRole.ADMIN } as any,
        planId,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
