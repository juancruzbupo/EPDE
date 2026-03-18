import { Test, TestingModule } from '@nestjs/testing';

import { TaskTemplatesController } from './task-templates.controller';
import { TaskTemplatesService } from './task-templates.service';

const mockTaskTemplatesService = {
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  reorder: jest.fn(),
};

const categoryId = 'category-uuid-1';
const templateId = 'template-uuid-1';

describe('TaskTemplatesController', () => {
  let controller: TaskTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskTemplatesController],
      providers: [{ provide: TaskTemplatesService, useValue: mockTaskTemplatesService }],
    }).compile();

    controller = module.get<TaskTemplatesController>(TaskTemplatesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with categoryId and dto and return wrapped data with message', async () => {
      const dto = { name: 'Revisar canaletas', recurrenceMonths: 6 };
      const created = { id: templateId, categoryId, ...dto };
      mockTaskTemplatesService.create.mockResolvedValue(created);

      const result = await controller.create(categoryId, dto as any);

      expect(mockTaskTemplatesService.create).toHaveBeenCalledWith(categoryId, dto);
      expect(result).toEqual({ data: created, message: 'Tarea template creada' });
    });

    it('should propagate service result unchanged inside the data envelope', async () => {
      const dto = { name: 'Limpiar desagues' };
      const serviceResult = { id: templateId, categoryId, name: 'Limpiar desagues', order: 0 };
      mockTaskTemplatesService.create.mockResolvedValue(serviceResult);

      const result = await controller.create(categoryId, dto as any);

      expect(result.data).toEqual(serviceResult);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto and return wrapped data with message', async () => {
      const dto = { name: 'Revisar canaletas (actualizado)' };
      const updated = { id: templateId, ...dto };
      mockTaskTemplatesService.update.mockResolvedValue(updated);

      const result = await controller.update(templateId, dto as any);

      expect(mockTaskTemplatesService.update).toHaveBeenCalledWith(templateId, dto);
      expect(result).toEqual({ data: updated, message: 'Plantilla de tarea actualizada' });
    });

    it('should propagate service result unchanged inside the data envelope', async () => {
      const dto = { recurrenceMonths: 12 };
      const serviceResult = { id: templateId, name: 'Revisar canaletas', recurrenceMonths: 12 };
      mockTaskTemplatesService.update.mockResolvedValue(serviceResult);

      const result = await controller.update(templateId, dto as any);

      expect(result.data).toEqual(serviceResult);
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove and return envelope', async () => {
      mockTaskTemplatesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(templateId);

      expect(mockTaskTemplatesService.remove).toHaveBeenCalledWith(templateId);
      expect(result).toEqual({ data: null, message: 'Tarea template eliminada' });
    });
  });

  describe('reorder', () => {
    it('should call service.reorder with categoryId and dto.ids and return envelope', async () => {
      const dto = { ids: ['t-1', 't-2', 't-3'] };
      mockTaskTemplatesService.reorder.mockResolvedValue(undefined);

      const result = await controller.reorder(categoryId, dto as any);

      expect(mockTaskTemplatesService.reorder).toHaveBeenCalledWith(categoryId, dto.ids);
      expect(result).toEqual({ data: null, message: 'Orden actualizado' });
    });

    it('should extract dto.ids (not the whole dto) to pass to service', async () => {
      const dto = { ids: ['t-a', 't-b'] };
      mockTaskTemplatesService.reorder.mockResolvedValue({});

      await controller.reorder(categoryId, dto as any);

      const [passedCategoryId, passedIds] = mockTaskTemplatesService.reorder.mock.calls[0];
      expect(passedCategoryId).toBe(categoryId);
      expect(passedIds).toEqual(['t-a', 't-b']);
    });
  });
});
