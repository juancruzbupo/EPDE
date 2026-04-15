import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { HealthIndexRepository } from '../dashboard/health-index.repository';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { TaskTemplatesRepository } from '../task-templates/task-templates.repository';
import { InspectionChecklistRepository } from './inspection-checklist.repository';
import { InspectionItemRepository } from './inspection-item.repository';
import { InspectionsService } from './inspections.service';

describe('InspectionsService', () => {
  let service: InspectionsService;

  const checklistRepo = {
    createWithItems: jest.fn(),
    findByProperty: jest.fn(),
    findByIdWithRelations: jest.fn(),
    findByIdWithActiveItems: jest.fn(),
    findActiveDraftByProperty: jest.fn(),
    findPropertyId: jest.fn(),
    findStatus: jest.fn(),
    updateNotes: jest.fn(),
    softDelete: jest.fn(),
    withTransaction: jest.fn(),
  };

  const itemRepo = {
    updateEvaluation: jest.fn(),
    addToChecklist: jest.fn(),
    findChecklistStatus: jest.fn(),
    exists: jest.fn(),
  };

  const taskTemplatesRepo = {
    findByIdsWithCategory: jest.fn(),
    findByIdsWithGuide: jest.fn().mockResolvedValue([]),
  };

  const categoryTemplatesRepo = {
    findAllWithTasks: jest.fn(),
  };

  const propertiesRepo = {
    findOwnership: jest.fn(),
    findActiveSectors: jest.fn(),
  };

  const notificationsHandler = {
    handlePlanGenerated: jest.fn(),
  };

  const healthIndexRepo = {
    invalidateHealthCaches: jest.fn().mockResolvedValue(undefined),
  };

  const mockTx = {
    category: { findFirst: jest.fn(), create: jest.fn() },
    maintenancePlan: { create: jest.fn(), findUnique: jest.fn() },
    task: { create: jest.fn() },
    taskLog: { create: jest.fn() },
    inspectionItem: { update: jest.fn() },
    inspectionChecklist: { update: jest.fn() },
  };

  const plansRepo = {
    existsForProperty: jest.fn().mockResolvedValue(false),
  };

  // Forward withTransaction calls onto the shared mockTx so existing
  // assertions on tx.category / tx.maintenancePlan / tx.task / ... keep
  // working without reshape.
  checklistRepo.withTransaction.mockImplementation(
    async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        { provide: InspectionChecklistRepository, useValue: checklistRepo },
        { provide: InspectionItemRepository, useValue: itemRepo },
        { provide: TaskTemplatesRepository, useValue: taskTemplatesRepo },
        { provide: CategoryTemplatesRepository, useValue: categoryTemplatesRepo },
        { provide: PropertiesRepository, useValue: propertiesRepo },
        { provide: NotificationsHandlerService, useValue: notificationsHandler },
        { provide: HealthIndexRepository, useValue: healthIndexRepo },
        { provide: MaintenancePlansRepository, useValue: plansRepo },
      ],
    }).compile();

    service = module.get(InspectionsService);
  });

  // ─── CRUD paths ─────────────────────────────────────

  describe('create', () => {
    it('throws ConflictException if an active DRAFT exists', async () => {
      checklistRepo.findActiveDraftByProperty.mockResolvedValue('existing-draft-id');

      await expect(
        service.create({ propertyId: 'p1', inspectedBy: 'u1', items: [] }),
      ).rejects.toThrow(ConflictException);
      expect(checklistRepo.createWithItems).not.toHaveBeenCalled();
    });

    it('delegates to the checklist repository when no draft exists', async () => {
      checklistRepo.findActiveDraftByProperty.mockResolvedValue(null);
      const data = { propertyId: 'p1', inspectedBy: 'u1', items: [] };

      await service.create(data);

      expect(checklistRepo.createWithItems).toHaveBeenCalledWith(data);
    });
  });

  describe('findByProperty', () => {
    it('returns inspections without ownership check when no userId is given (admin)', async () => {
      checklistRepo.findByProperty.mockResolvedValue([]);

      await service.findByProperty('p1');

      expect(checklistRepo.findByProperty).toHaveBeenCalledWith('p1');
      expect(propertiesRepo.findOwnership).not.toHaveBeenCalled();
    });

    it('verifies ownership when a userId is provided', async () => {
      propertiesRepo.findOwnership.mockResolvedValue({ userId: 'u1' });
      checklistRepo.findByProperty.mockResolvedValue([]);

      await service.findByProperty('p1', 'u1');

      expect(propertiesRepo.findOwnership).toHaveBeenCalledWith('p1');
    });

    it('throws when the client does not own the property', async () => {
      propertiesRepo.findOwnership.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.findByProperty('p1', 'u1')).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the checklist is missing', async () => {
      checklistRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(service.findById('c1')).rejects.toThrow(NotFoundException);
    });

    it('returns the checklist when found', async () => {
      const checklist = { id: 'c1', propertyId: 'p1', items: [] };
      checklistRepo.findByIdWithRelations.mockResolvedValue(checklist);

      const result = await service.findById('c1');

      expect(result).toEqual(checklist);
    });
  });

  describe('remove', () => {
    it('verifies the checklist exists and soft-deletes it', async () => {
      checklistRepo.findPropertyId.mockResolvedValue('p1');
      checklistRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('c1');

      expect(checklistRepo.softDelete).toHaveBeenCalledWith('c1');
    });
  });

  // ─── Plan generation happy path ────────────────────────

  describe('generatePlanFromInspection', () => {
    const makeChecklist = (items: Partial<Record<string, unknown>>[]) => ({
      id: 'c1',
      propertyId: 'p1',
      inspectedBy: 'inspector-1',
      inspectedAt: new Date('2026-04-08'),
      deletedAt: null,
      property: { userId: 'owner-1', address: 'Calle 1' },
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
      plansRepo.existsForProperty.mockResolvedValue(false);
      mockTx.category.findFirst.mockResolvedValue(null);
      mockTx.category.create.mockResolvedValue({ id: 'cat-1' });
      mockTx.maintenancePlan.create.mockResolvedValue({ id: 'plan-1' });
      mockTx.task.create.mockResolvedValue({ id: 'task-1' });
      mockTx.taskLog.create.mockResolvedValue({ id: 'log-1' });
      mockTx.inspectionItem.update.mockResolvedValue({});
      mockTx.inspectionChecklist.update.mockResolvedValue({});
      mockTx.maintenancePlan.findUnique.mockResolvedValue({ id: 'plan-1', tasks: [] });
    });

    it('throws NotFoundException if checklist is missing', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(null);

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if items are still PENDING', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(
        makeChecklist([{ status: 'PENDING' }]),
      );

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException if a plan already exists', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      plansRepo.existsForProperty.mockResolvedValue(true);

      await expect(service.generatePlanFromInspection('c1', 'Plan', 'u1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates plan with sourceInspectionId and marks checklist COMPLETED', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

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
      expect(mockTx.inspectionChecklist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('creates baseline TaskLog with inspector attribution and EPDE_PROFESSIONAL executor', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'admin-1');

      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            executor: 'EPDE_PROFESSIONAL',
            actionTaken: 'INSPECTION_ONLY',
            conditionFound: 'GOOD',
            completedBy: 'inspector-1',
          }),
        }),
      );
    });

    it('maps NEEDS_ATTENTION to HIGH priority and FAIR condition', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(
        makeChecklist([{ status: 'NEEDS_ATTENTION' }]),
      );
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priority: 'HIGH' }) }),
      );
      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ conditionFound: 'FAIR' }) }),
      );
    });

    it('maps NEEDS_PROFESSIONAL to URGENT + PROFESSIONAL_REQUIRED + POOR condition', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(
        makeChecklist([{ status: 'NEEDS_PROFESSIONAL' }]),
      );
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'URGENT',
            professionalRequirement: 'PROFESSIONAL_REQUIRED',
          }),
        }),
      );
      expect(mockTx.taskLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ conditionFound: 'POOR' }) }),
      );
    });

    it('sets nextDueDate to null for ON_DETECTION tasks', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        {
          ...makeTemplate('tpl-0', 'cat-tpl-1'),
          recurrenceType: 'ON_DETECTION',
          recurrenceMonths: null,
        },
      ]);

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

    it('links the inspection item to the created task', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);
      mockTx.task.create.mockResolvedValue({ id: 'new-task-1' });

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.inspectionItem.update).toHaveBeenCalledWith({
        where: { id: 'item-0' },
        data: { taskId: 'new-task-1' },
      });
    });

    it('falls back to Observaciones category for custom items', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(
        makeChecklist([{ status: 'OK', taskTemplateId: null, isCustom: true }]),
      );
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([]);
      mockTx.category.findFirst.mockResolvedValue(null);
      mockTx.category.create.mockResolvedValue({ id: 'obs-cat' });

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(mockTx.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Observaciones' }) }),
      );
    });

    it('fires the plan-generated notification post-commit', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(notificationsHandler.handlePlanGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner-1',
          propertyId: 'p1',
          propertyAddress: 'Calle 1',
        }),
      );
    });

    it('invalidates health caches after generation', async () => {
      checklistRepo.findByIdWithActiveItems.mockResolvedValue(makeChecklist([{ status: 'OK' }]));
      taskTemplatesRepo.findByIdsWithCategory.mockResolvedValue([
        makeTemplate('tpl-0', 'cat-tpl-1'),
      ]);

      await service.generatePlanFromInspection('c1', 'Plan', 'u1');

      expect(healthIndexRepo.invalidateHealthCaches).toHaveBeenCalled();
    });
  });

  // ─── generateItemsFromTemplates ───────────────────────

  describe('generateItemsFromTemplates', () => {
    it('throws NotFoundException if property not found', async () => {
      propertiesRepo.findActiveSectors.mockResolvedValue(null);

      await expect(service.generateItemsFromTemplates('p1')).rejects.toThrow(NotFoundException);
    });

    it('groups template items by the property active sectors', async () => {
      propertiesRepo.findActiveSectors.mockResolvedValue(['ROOF', 'EXTERIOR']);
      categoryTemplatesRepo.findAllWithTasks.mockResolvedValue([
        {
          tasks: [
            {
              id: 't1',
              defaultSector: 'ROOF',
              name: 'Check roof',
              technicalDescription: 'desc',
              inspectionGuide: null,
              guideImageUrls: [],
            },
            {
              id: 't2',
              defaultSector: 'EXTERIOR',
              name: 'Check walls',
              technicalDescription: null,
              inspectionGuide: null,
              guideImageUrls: [],
            },
            {
              id: 't3',
              defaultSector: 'INTERIOR',
              name: 'Check floors',
              technicalDescription: null,
              inspectionGuide: null,
              guideImageUrls: [],
            },
          ],
        },
      ]);

      const result = await service.generateItemsFromTemplates('p1');

      expect(result).toHaveLength(2);
      const sectors = result.map((r) => r.sector).sort();
      expect(sectors).toEqual(['EXTERIOR', 'ROOF']);
    });

    it('ignores templates without defaultSector', async () => {
      propertiesRepo.findActiveSectors.mockResolvedValue(['ROOF']);
      categoryTemplatesRepo.findAllWithTasks.mockResolvedValue([
        {
          tasks: [
            {
              id: 't1',
              defaultSector: null,
              name: 'No sector',
              technicalDescription: null,
              inspectionGuide: null,
              guideImageUrls: [],
            },
            {
              id: 't2',
              defaultSector: 'ROOF',
              name: 'Has sector',
              technicalDescription: null,
              inspectionGuide: null,
              guideImageUrls: [],
            },
          ],
        },
      ]);

      const result = await service.generateItemsFromTemplates('p1');

      expect(result).toHaveLength(1);
      expect(result[0]!.items).toHaveLength(1);
      expect(result[0]!.items[0]!.name).toBe('Has sector');
    });
  });
});
