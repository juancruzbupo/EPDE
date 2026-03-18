import { Test, TestingModule } from '@nestjs/testing';

import { CategoryTemplatesController } from './category-templates.controller';
import { CategoryTemplatesService } from './category-templates.service';

const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  reorder: jest.fn(),
};

const templateId = 'template-uuid-1';

describe('CategoryTemplatesController', () => {
  let controller: CategoryTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryTemplatesController],
      providers: [{ provide: CategoryTemplatesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoryTemplatesController>(CategoryTemplatesController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should delegate to service.list and return PaginatedResult directly', async () => {
      const filters = { cursor: undefined, take: 10 };
      const paginatedResult = { data: [], nextCursor: null, hasMore: false };
      mockService.list.mockResolvedValue(paginatedResult);

      const result = await controller.list(filters as any);

      expect(mockService.list).toHaveBeenCalledWith(filters);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass filters through without transformation', async () => {
      const filters = { cursor: 'abc-cursor', take: 20 };
      mockService.list.mockResolvedValue({ data: [], nextCursor: null, hasMore: false });

      await controller.list(filters as any);

      expect(mockService.list).toHaveBeenCalledWith(filters);
    });
  });

  describe('getById', () => {
    it('should delegate to service.getById and return { data }', async () => {
      const template = { id: templateId, name: 'Electricidad' };
      mockService.getById.mockResolvedValue(template);

      const result = await controller.getById(templateId);

      expect(mockService.getById).toHaveBeenCalledWith(templateId);
      expect(result).toEqual({ data: template });
    });
  });

  describe('create', () => {
    it('should delegate to service.create and return { data, message }', async () => {
      const dto = { name: 'Plomeria', description: 'Tareas de plomeria' };
      const created = { id: templateId, ...dto };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ data: created, message: 'Categoría template creada' });
    });
  });

  describe('reorder', () => {
    it('should delegate to service.reorder with dto.ids and return envelope', async () => {
      const ids = ['id-1', 'id-2', 'id-3'];
      const dto = { ids };
      mockService.reorder.mockResolvedValue(undefined);

      const result = await controller.reorder(dto as any);

      expect(mockService.reorder).toHaveBeenCalledWith(ids);
      expect(result).toEqual({ data: null, message: 'Orden actualizado' });
    });

    it('should extract ids from dto (not pass the whole dto)', async () => {
      const ids = ['id-a', 'id-b'];
      mockService.reorder.mockResolvedValue(undefined);

      await controller.reorder({ ids } as any);

      const [passedArg] = mockService.reorder.mock.calls[0];
      expect(passedArg).toEqual(ids);
    });
  });

  describe('update', () => {
    it('should delegate to service.update with id and dto and return { data, message }', async () => {
      const dto = { name: 'Electricidad actualizada' };
      const updated = { id: templateId, name: 'Electricidad actualizada' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(templateId, dto as any);

      expect(mockService.update).toHaveBeenCalledWith(templateId, dto);
      expect(result).toEqual({ data: updated, message: 'Plantilla de categoría actualizada' });
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove and return envelope', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(templateId);

      expect(mockService.remove).toHaveBeenCalledWith(templateId);
      expect(result).toEqual({ data: null, message: 'Categoría template eliminada' });
    });
  });
});
