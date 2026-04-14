import { PrismaService } from '../prisma/prisma.service';
import { InspectionsRepository } from './inspections.repository';

interface MockModel {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  aggregate: jest.Mock;
  updateMany: jest.Mock;
}

interface MockPrisma {
  inspectionChecklist: MockModel;
  inspectionItem: MockModel;
  maintenancePlan: MockModel;
  $transaction: jest.Mock;
}

describe('InspectionsRepository', () => {
  let repository: InspectionsRepository;
  let mockChecklist: MockModel;
  let mockItem: MockModel;
  let mockPlan: MockModel;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    const mkModel = (): MockModel => ({
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
    });
    mockChecklist = mkModel();
    mockItem = mkModel();
    mockPlan = mkModel();
    mockPrisma = {
      inspectionChecklist: mockChecklist,
      inspectionItem: mockItem,
      maintenancePlan: mockPlan,
      $transaction: jest.fn(),
    };
    repository = new InspectionsRepository(mockPrisma as unknown as PrismaService);
  });

  describe('create', () => {
    const baseData = {
      propertyId: 'prop-1',
      inspectedBy: 'user-1',
      items: [
        { sector: 'ROOF' as const, name: 'Tejas' },
        { sector: 'EXTERIOR' as const, name: 'Pintura', description: 'Revisar descascaramiento' },
      ],
    };

    it('passes items with correct defaults (status PENDING, isCustom false, guideImageUrls [], order = index)', async () => {
      mockChecklist.create.mockResolvedValue({ id: 'checklist-1' });

      await repository.create(baseData);

      const call = mockChecklist.create.mock.calls[0][0];
      const items = call.data.items.create;

      expect(items[0]).toEqual(
        expect.objectContaining({
          sector: 'ROOF',
          name: 'Tejas',
          status: 'PENDING',
          isCustom: false,
          guideImageUrls: [],
          order: 0,
        }),
      );
      expect(items[1]).toEqual(
        expect.objectContaining({
          sector: 'EXTERIOR',
          name: 'Pintura',
          status: 'PENDING',
          isCustom: false,
          guideImageUrls: [],
          order: 1,
        }),
      );
    });

    it('includes items ordered by order asc', async () => {
      mockChecklist.create.mockResolvedValue({ id: 'checklist-1' });

      await repository.create(baseData);

      const call = mockChecklist.create.mock.calls[0][0];
      expect(call.include).toEqual({
        items: { orderBy: { order: 'asc' } },
      });
    });
  });

  describe('findByProperty', () => {
    it('passes propertyId, filters out soft-deleted, orders by inspectedAt desc', async () => {
      mockChecklist.findMany.mockResolvedValue([]);

      await repository.findByProperty('prop-1');

      expect(mockChecklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { propertyId: 'prop-1', deletedAt: null },
          orderBy: { inspectedAt: 'desc' },
        }),
      );
    });

    it('includes items and inspector', async () => {
      mockChecklist.findMany.mockResolvedValue([]);

      await repository.findByProperty('prop-1');

      const call = mockChecklist.findMany.mock.calls[0][0];
      expect(call.include).toEqual({
        items: { orderBy: { order: 'asc' } },
        inspector: { select: { id: true, name: true } },
      });
    });
  });

  describe('findById', () => {
    it('uses findUnique with includes', async () => {
      mockChecklist.findUnique.mockResolvedValue(null);

      await repository.findById('checklist-1');

      expect(mockChecklist.findUnique).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
        include: {
          items: { orderBy: { order: 'asc' } },
          inspector: { select: { id: true, name: true } },
        },
      });
    });
  });

  describe('updateItem', () => {
    it('only includes defined fields in data', async () => {
      mockItem.update.mockResolvedValue({ id: 'item-1' });

      await repository.updateItem('item-1', {
        status: 'OK' as never,
        finding: 'Grieta menor',
      });

      const call = mockItem.update.mock.calls[0][0];
      expect(call.data).toEqual({ status: 'OK', finding: 'Grieta menor' });
    });

    it('omits undefined fields', async () => {
      mockItem.update.mockResolvedValue({ id: 'item-1' });

      await repository.updateItem('item-1', { finding: 'Solo finding' });

      const call = mockItem.update.mock.calls[0][0];
      expect(call.data).toEqual({ finding: 'Solo finding' });
      expect(call.data).not.toHaveProperty('status');
      expect(call.data).not.toHaveProperty('photoUrl');
    });
  });

  describe('addItem', () => {
    it('aggregates max order and creates with order + 1', async () => {
      mockItem.aggregate.mockResolvedValue({ _max: { order: 5 } });
      mockItem.create.mockResolvedValue({ id: 'item-new' });

      await repository.addItem('checklist-1', {
        sector: 'INTERIOR' as never,
        name: 'Humedad',
      });

      expect(mockItem.aggregate).toHaveBeenCalledWith({
        where: { checklistId: 'checklist-1' },
        _max: { order: true },
      });
      expect(mockItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          checklistId: 'checklist-1',
          sector: 'INTERIOR',
          name: 'Humedad',
          isCustom: true,
          order: 6,
        }),
      });
    });
  });

  describe('updateNotes', () => {
    it('updates by checklistId', async () => {
      mockChecklist.update.mockResolvedValue({ id: 'checklist-1' });

      await repository.updateNotes('checklist-1', 'Notas actualizadas');

      expect(mockChecklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
        data: { notes: 'Notas actualizadas' },
      });
    });
  });

  describe('softDelete', () => {
    it('uses $transaction with deletedAt:null filter, shared timestamp, and detaches plan back-reference', async () => {
      mockPrisma.$transaction.mockResolvedValue([]);
      const before = new Date();

      await repository.softDelete('checklist-1');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // $transaction receives an array of three operations: items soft-delete,
      // checklist soft-delete, and plan back-reference detach.
      const txArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(txArg).toHaveLength(3);

      // Verify updateMany was called with deletedAt:null filter
      expect(mockItem.updateMany).toHaveBeenCalledWith({
        where: { checklistId: 'checklist-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify checklist update
      expect(mockChecklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify plan back-reference is detached so the UI doesn't try to resolve
      // a now-soft-deleted inspection from sourceInspectionId.
      expect(mockPlan.updateMany).toHaveBeenCalledWith({
        where: { sourceInspectionId: 'checklist-1' },
        data: { sourceInspectionId: null },
      });

      // Items and checklist share the same timestamp (atomic snapshot).
      const itemDeletedAt = mockItem.updateMany.mock.calls[0][0].data.deletedAt;
      const checklistDeletedAt = mockChecklist.update.mock.calls[0][0].data.deletedAt;
      expect(itemDeletedAt).toBe(checklistDeletedAt);
      expect(itemDeletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
