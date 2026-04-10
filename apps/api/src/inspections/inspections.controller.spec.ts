import { type CurrentUser as CurrentUserPayload, UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

const mockInspectionsService = {
  create: jest.fn(),
  findByProperty: jest.fn(),
  findById: jest.fn(),
  updateItem: jest.fn(),
  addItem: jest.fn(),
  updateNotes: jest.fn(),
  generateItemsFromTemplates: jest.fn(),
  generatePlanFromInspection: jest.fn(),
  remove: jest.fn(),
};

const adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  subscriptionExpiresAt: null,
  jti: 'jti-admin-1',
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  subscriptionExpiresAt: null,
  jti: 'jti-client-1',
};

const propertyId = 'property-uuid-1';
const inspectionId = 'inspection-uuid-1';
const checklistId = 'checklist-uuid-1';
const itemId = 'item-uuid-1';

describe('InspectionsController', () => {
  let controller: InspectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionsController],
      providers: [{ provide: InspectionsService, useValue: mockInspectionsService }],
    }).compile();

    controller = module.get<InspectionsController>(InspectionsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should delegate to service.create with inspectedBy set to user.id', async () => {
      const body = { propertyId, date: '2026-04-10' };
      const created = { id: inspectionId, ...body, inspectedBy: adminUser.id };
      mockInspectionsService.create.mockResolvedValue(created);

      const result = await controller.create(body as never, adminUser);

      expect(mockInspectionsService.create).toHaveBeenCalledWith({
        ...body,
        inspectedBy: adminUser.id,
      });
      expect(result).toEqual({ data: created });
    });
  });

  describe('findByProperty', () => {
    it('should pass undefined userId when called by ADMIN', async () => {
      const inspections = [{ id: inspectionId }];
      mockInspectionsService.findByProperty.mockResolvedValue(inspections);

      const result = await controller.findByProperty(propertyId, adminUser);

      expect(mockInspectionsService.findByProperty).toHaveBeenCalledWith(propertyId, undefined);
      expect(result).toEqual({ data: inspections });
    });

    it('should pass user.id when called by CLIENT', async () => {
      const inspections = [{ id: inspectionId }];
      mockInspectionsService.findByProperty.mockResolvedValue(inspections);

      const result = await controller.findByProperty(propertyId, clientUser);

      expect(mockInspectionsService.findByProperty).toHaveBeenCalledWith(propertyId, clientUser.id);
      expect(result).toEqual({ data: inspections });
    });
  });

  describe('getTemplateItems', () => {
    it('should delegate to service.generateItemsFromTemplates', async () => {
      const items = [{ name: 'Techo', category: 'Exterior' }];
      mockInspectionsService.generateItemsFromTemplates.mockResolvedValue(items);

      const result = await controller.getTemplateItems(propertyId);

      expect(mockInspectionsService.generateItemsFromTemplates).toHaveBeenCalledWith(propertyId);
      expect(result).toEqual({ data: items });
    });
  });

  describe('findById', () => {
    it('should pass undefined userId when called by ADMIN', async () => {
      const inspection = { id: inspectionId };
      mockInspectionsService.findById.mockResolvedValue(inspection);

      const result = await controller.findById(inspectionId, adminUser);

      expect(mockInspectionsService.findById).toHaveBeenCalledWith(inspectionId, undefined);
      expect(result).toEqual({ data: inspection });
    });

    it('should pass user.id when called by CLIENT', async () => {
      const inspection = { id: inspectionId };
      mockInspectionsService.findById.mockResolvedValue(inspection);

      const result = await controller.findById(inspectionId, clientUser);

      expect(mockInspectionsService.findById).toHaveBeenCalledWith(inspectionId, clientUser.id);
      expect(result).toEqual({ data: inspection });
    });
  });

  describe('updateItem', () => {
    it('should delegate to service.updateItem with itemId and body', async () => {
      const body = { status: 'GOOD', notes: 'Sin observaciones' };
      const updated = { id: itemId, ...body };
      mockInspectionsService.updateItem.mockResolvedValue(updated);

      const result = await controller.updateItem(itemId, body as never);

      expect(mockInspectionsService.updateItem).toHaveBeenCalledWith(itemId, body);
      expect(result).toEqual({ data: updated });
    });
  });

  describe('addItem', () => {
    it('should delegate to service.addItem with checklistId and body', async () => {
      const body = { name: 'Humedad', category: 'Interior' };
      const added = { id: itemId, ...body };
      mockInspectionsService.addItem.mockResolvedValue(added);

      const result = await controller.addItem(checklistId, body as never);

      expect(mockInspectionsService.addItem).toHaveBeenCalledWith(checklistId, body);
      expect(result).toEqual({ data: added });
    });
  });

  describe('updateNotes', () => {
    it('should delegate to service.updateNotes with checklistId and notes string', async () => {
      const body = { notes: 'Observaciones generales de la inspección' };
      const updated = { id: checklistId, notes: body.notes };
      mockInspectionsService.updateNotes.mockResolvedValue(updated);

      const result = await controller.updateNotes(checklistId, body);

      expect(mockInspectionsService.updateNotes).toHaveBeenCalledWith(checklistId, body.notes);
      expect(result).toEqual({ data: updated });
    });
  });

  describe('generatePlan', () => {
    it('should delegate to service.generatePlanFromInspection and return data with message', async () => {
      const body = { planName: 'Plan 2026' };
      const plan = { id: 'plan-uuid-1', name: body.planName };
      mockInspectionsService.generatePlanFromInspection.mockResolvedValue(plan);

      const result = await controller.generatePlan(checklistId, body as never, adminUser);

      expect(mockInspectionsService.generatePlanFromInspection).toHaveBeenCalledWith(
        checklistId,
        body.planName,
        adminUser.id,
      );
      expect(result).toEqual({
        data: plan,
        message: 'Plan de mantenimiento generado desde inspección',
      });
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove and return null data with message', async () => {
      mockInspectionsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(inspectionId);

      expect(mockInspectionsService.remove).toHaveBeenCalledWith(inspectionId);
      expect(result).toEqual({ data: null, message: 'Inspección eliminada' });
    });
  });
});
