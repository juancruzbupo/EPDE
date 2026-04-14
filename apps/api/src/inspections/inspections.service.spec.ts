import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { TaskTemplatesRepository } from '../task-templates/task-templates.repository';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let repository: {
    create: jest.Mock;
    findByProperty: jest.Mock;
    findById: jest.Mock;
    updateItem: jest.Mock;
    addItem: jest.Mock;
    updateNotes: jest.Mock;
    softDelete: jest.Mock;
  };

  const mockTx = {
    category: { findFirst: jest.fn(), create: jest.fn() },
    maintenancePlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    task: { create: jest.fn() },
    taskLog: { create: jest.fn() },
    inspectionItem: { update: jest.fn() },
    // The service marks the checklist COMPLETED at the end of the transaction
    // once tasks are created. Mocked as a no-op here.
    inspectionChecklist: { update: jest.fn() },
  };

  const mockPrisma = {
    property: { findUnique: jest.fn() },
    categoryTemplate: { findMany: jest.fn() },
    inspectionChecklist: { findUnique: jest.fn() },
    maintenancePlan: { findUnique: jest.fn() },
    taskTemplate: { findMany: jest.fn() },
    inspectionItem: { findUnique: jest.fn() },
    $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  } as unknown as PrismaService;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findByProperty: jest.fn(),
      findById: jest.fn(),
      // Delegated by default to the inspectionChecklist.findUnique prisma mock so
      // existing tests that set `mockPrisma.inspectionChecklist.findUnique.mockResolvedValue(...)`
      // keep working after the service was refactored to call the repository method.
      findByIdWithActiveItems: jest.fn(
        (id: string) =>
          (
            mockPrisma as unknown as {
              inspectionChecklist?: { findUnique: (args: { where: { id: string } }) => unknown };
            }
          ).inspectionChecklist?.findUnique({ where: { id } }) ?? Promise.resolve(null),
      ),
      updateItem: jest.fn(),
      addItem: jest.fn(),
      updateNotes: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        { provide: InspectionsRepository, useValue: repository },
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: TaskTemplatesRepository,
          // Delegate to mockPrisma.taskTemplate.findMany so tests that set that mock keep working.
          useValue: {
            findByIdsWithCategory: jest.fn((ids: string[]) =>
              mockPrisma.taskTemplate.findMany({
                where: { id: { in: ids } },
                include: { category: true },
              }),
            ),
          },
        },
        {
          provide: CategoryTemplatesRepository,
          useValue: {
            findAll: jest.fn(),
            findManyWithTasksByPropertyActiveSectors: jest.fn((propertyId: string) =>
              mockPrisma.categoryTemplate.findMany({ where: { propertyId } }),
            ),
          },
        },
        { provide: PropertiesRepository, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    service = module.get(InspectionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── CRUD methods ─────────────────────────────────────

  describe('create', () => {
    it('should delegate to repository', async () => {
      const data = { propertyId: 'p1', inspectedBy: 'u1', items: [] };
      repository.create.mockResolvedValue({ id: 'c1', ...data });

      await service.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('findByProperty', () => {
    it('should return inspections without ownership check for admin', async () => {
      repository.findByProperty.mockResolvedValue([]);

      await service.findByProperty('p1');

      expect(repository.findByProperty).toHaveBeenCalledWith('p1');
    });

    it('should verify ownership for client', async () => {
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue({ userId: 'u1' });
      repository.findByProperty.mockResolvedValue([]);

      await service.findByProperty('p1', 'u1');

      expect(mockPrisma.property.findUnique).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if client does not own property', async () => {
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue({ userId: 'other-user' });

      await expect(service.findByProperty('p1', 'u1')).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('c1')).rejects.toThrow(NotFoundException);
    });

    it('should return checklist if found', async () => {
      const checklist = { id: 'c1', propertyId: 'p1', items: [] };
      repository.findById.mockResolvedValue(checklist);

      const result = await service.findById('c1');

      expect(result).toEqual(checklist);
    });
  });

  describe('remove', () => {
    it('should call softDelete', async () => {
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', propertyId: 'p1' }),
      };
      repository.softDelete.mockResolvedValue(undefined);

      await service.remove('c1');

      expect(repository.softDelete).toHaveBeenCalledWith('c1');
    });
  });

  // ─── generateItemsFromTemplates ───────────────────────

  describe('generateItemsFromTemplates', () => {
    it('should throw NotFoundException if property not found', async () => {
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.generateItemsFromTemplates('p1')).rejects.toThrow(NotFoundException);
    });

    it('should return items grouped by sector', async () => {
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue({
        activeSectors: ['ROOF', 'EXTERIOR'],
      });
      mockPrisma.categoryTemplate.findMany = jest.fn().mockResolvedValue([
        {
          tasks: [
            { id: 't1', defaultSector: 'ROOF', name: 'Check roof', technicalDescription: 'desc' },
            {
              id: 't2',
              defaultSector: 'EXTERIOR',
              name: 'Check walls',
              technicalDescription: null,
            },
            {
              id: 't3',
              defaultSector: 'INTERIOR',
              name: 'Check floors',
              technicalDescription: null,
            },
          ],
        },
      ]);

      const result = await service.generateItemsFromTemplates('p1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        sector: 'ROOF',
        items: [{ taskTemplateId: 't1', name: 'Check roof', description: 'desc' }],
      });
      expect(result[1]).toEqual({
        sector: 'EXTERIOR',
        items: [{ taskTemplateId: 't2', name: 'Check walls', description: null }],
      });
    });

    it('should exclude templates without defaultSector', async () => {
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue({
        activeSectors: ['ROOF'],
      });
      mockPrisma.categoryTemplate.findMany = jest.fn().mockResolvedValue([
        {
          tasks: [
            { id: 't1', defaultSector: null, name: 'No sector', technicalDescription: null },
            { id: 't2', defaultSector: 'ROOF', name: 'Has sector', technicalDescription: null },
          ],
        },
      ]);

      const result = await service.generateItemsFromTemplates('p1');

      expect(result).toHaveLength(1);
      expect(result[0]!.items).toHaveLength(1);
      expect(result[0]!.items[0]!.name).toBe('Has sector');
    });
  });

  // ─── generatePlanFromInspection ───────────────────────

  describe('generatePlanFromInspection', () => {
    const makeChecklist = (items: Partial<Record<string, unknown>>[]) => ({
      id: 'c1',
      propertyId: 'p1',
      inspectedBy: 'inspector-1',
      inspectedAt: new Date('2026-04-08'),
      deletedAt: null,
      items: items.map((item, i) => ({
        id: `item-${i}`,
        sector: 'EXTERIOR',
        name: `Item ${i}`,
        description: null,
        status: 'OK',
        finding: null,
        photoUrl: null,
        taskTemplateId: `tpl-${i}`,
        isCustom: false,
        ...item,
      })),
    });

    const makeTemplate = (id: string, categoryId: string) => ({
      id,
      categoryId,
      category: { name: 'Cat', icon: '🏗', description: 'Desc' },
      priority: 'MEDIUM',
      professionalRequirement: 'OWNER_CAN_DO',
      taskType: 'INSPECTION',
      recurrenceType: 'ANNUAL',
      recurrenceMonths: 12,
      estimatedDurationMinutes: 30,
      technicalDescription: 'Tech desc',
    });

    beforeEach(() => {
      mockPrisma.maintenancePlan.findUnique = jest.fn().mockResolvedValue(null);
      mockTx.category.findFirst.mockResolvedValue(null);
      mockTx.category.create.mockResolvedValue({ id: 'cat-1' });
      mockTx.maintenancePlan.create.mockResolvedValue({ id: 'plan-1' });
      mockTx.task.create.mockResolvedValue({ id: 'task-1' });
      mockTx.taskLog.create.mockResolvedValue({ id: 'log-1' });
      mockTx.inspectionItem.update.mockResolvedValue({});
      mockTx.maintenancePlan.findUnique.mockResolvedValue({ id: 'plan-1', tasks: [] });
    });

    it('should throw NotFoundException if checklist not found', async () => {
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if items are PENDING', async () => {
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(makeChecklist([{ status: 'PENDING' }])),
      };

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if plan already exists', async () => {
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(makeChecklist([{ status: 'OK' }])),
      };
      mockPrisma.maintenancePlan.findUnique = jest.fn().mockResolvedValue({ id: 'existing' });

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create plan with sourceInspectionId', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Mi Plan', 'u1');

      expect(mockTx.maintenancePlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Mi Plan',
            sourceInspectionId: 'c1',
            propertyId: 'p1',
            status: 'DRAFT',
          }),
        }),
      );
    });

    it('should create task for each item', async () => {
      const checklist = makeChecklist([
        { status: 'OK' },
        { status: 'NEEDS_ATTENTION', finding: 'Fisura' },
      ]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([
          makeTemplate('tpl-0', 'cat-tpl-1'),
          makeTemplate('tpl-1', 'cat-tpl-1'),
        ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledTimes(2);
    });

    it('should create baseline TaskLog for each task', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            executor: 'EPDE_PROFESSIONAL',
            actionTaken: 'INSPECTION_ONLY',
            conditionFound: 'GOOD',
          }),
        }),
      );
    });

    it('should attribute baseline TaskLog to the inspector, not the admin who generated the plan', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      // u1 = admin running generate-plan; inspector-1 = who actually inspected.
      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedBy: 'inspector-1',
          }),
        }),
      );
    });

    it('should adjust priority to HIGH for NEEDS_ATTENTION', async () => {
      const checklist = makeChecklist([{ status: 'NEEDS_ATTENTION' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: 'HIGH' }),
        }),
      );
    });

    it('should adjust priority to URGENT and require professional for NEEDS_PROFESSIONAL', async () => {
      const checklist = makeChecklist([{ status: 'NEEDS_PROFESSIONAL' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'URGENT',
            professionalRequirement: 'PROFESSIONAL_REQUIRED',
          }),
        }),
      );
    });

    it('should set nextDueDate in the future for recurrent tasks', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      const before = Date.now();
      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      const createCall = mockTx.task.create.mock.calls[0]?.[0] as
        | { data: { nextDueDate: Date | null } }
        | undefined;
      const nextDueDate = createCall?.data.nextDueDate;
      expect(nextDueDate).toBeInstanceOf(Date);
      expect((nextDueDate as Date).getTime()).toBeGreaterThan(before);
    });

    it('should set nextDueDate to null for ON_DETECTION tasks', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      const onDetectionTemplate = {
        ...makeTemplate('tpl-0', 'cat-tpl-1'),
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: null,
      };
      mockPrisma.taskTemplate.findMany = jest.fn().mockResolvedValue([onDetectionTemplate]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recurrenceType: 'ON_DETECTION',
            nextDueDate: null,
          }),
        }),
      );
    });

    it('should link InspectionItem.taskId to created Task', async () => {
      const checklist = makeChecklist([{ status: 'OK' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);
      mockTx.task.create.mockResolvedValue({ id: 'new-task-1' });

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.inspectionItem.update).toHaveBeenCalledWith({
        where: { id: 'item-0' },
        data: { taskId: 'new-task-1' },
      });
    });

    it('should create Observaciones category for custom items', async () => {
      const checklist = makeChecklist([{ status: 'OK', taskTemplateId: null, isCustom: true }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest.fn().mockResolvedValue([]);
      mockTx.category.findFirst.mockResolvedValue(null);
      mockTx.category.create.mockResolvedValue({ id: 'obs-cat' });

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Observaciones' }),
        }),
      );
    });

    it('should copy finding and photoUrl to task', async () => {
      const checklist = makeChecklist([
        { status: 'NEEDS_ATTENTION', finding: 'Grieta visible', photoUrl: 'https://r2/photo.jpg' },
      ]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inspectionFinding: 'Grieta visible',
            inspectionPhotoUrl: 'https://r2/photo.jpg',
          }),
        }),
      );
    });

    it('should map NEEDS_ATTENTION to FAIR conditionFound in baseline log', async () => {
      const checklist = makeChecklist([{ status: 'NEEDS_ATTENTION' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ conditionFound: 'FAIR' }),
        }),
      );
    });

    it('should map NEEDS_PROFESSIONAL to POOR conditionFound in baseline log', async () => {
      const checklist = makeChecklist([{ status: 'NEEDS_PROFESSIONAL' }]);
      (mockPrisma as unknown as Record<string, unknown>).inspectionChecklist = {
        findUnique: jest.fn().mockResolvedValue(checklist),
      };
      mockPrisma.taskTemplate.findMany = jest
        .fn()
        .mockResolvedValue([makeTemplate('tpl-0', 'cat-tpl-1')]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ conditionFound: 'POOR' }),
        }),
      );
    });
  });
});
