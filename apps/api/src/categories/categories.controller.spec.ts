import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const mockCategoriesService = {
  findAll: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

const categoryId = 'cat-uuid-1';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should delegate to categoriesService.findAll and return wrapped data', async () => {
      const categories = [{ id: categoryId, name: 'Electricidad' }];
      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(mockCategoriesService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: categories });
    });

    it('should return empty array wrapped in data envelope when no categories exist', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({ data: [] });
    });
  });

  describe('createCategory', () => {
    it('should delegate to categoriesService.createCategory and return wrapped data with message', async () => {
      const dto = { name: 'Plomeria' };
      const created = { id: categoryId, name: 'Plomeria' };
      mockCategoriesService.createCategory.mockResolvedValue(created);

      const result = await controller.createCategory(dto as any);

      expect(mockCategoriesService.createCategory).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ data: created, message: 'Categoría creada' });
    });

    it('should propagate service errors', async () => {
      const dto = { name: 'Duplicada' };
      mockCategoriesService.createCategory.mockRejectedValue(new Error('Conflict'));

      await expect(controller.createCategory(dto as any)).rejects.toThrow('Conflict');
    });
  });

  describe('updateCategory', () => {
    it('should delegate to categoriesService.updateCategory with id and dto and return wrapped data with message', async () => {
      const dto = { name: 'Electricidad actualizada' };
      const updated = { id: categoryId, name: 'Electricidad actualizada' };
      mockCategoriesService.updateCategory.mockResolvedValue(updated);

      const result = await controller.updateCategory(categoryId, dto as any);

      expect(mockCategoriesService.updateCategory).toHaveBeenCalledWith(categoryId, dto);
      expect(result).toEqual({ data: updated, message: 'Categoría actualizada' });
    });

    it('should propagate service errors on update', async () => {
      mockCategoriesService.updateCategory.mockRejectedValue(new Error('Not found'));

      await expect(controller.updateCategory(categoryId, {} as any)).rejects.toThrow('Not found');
    });
  });

  describe('deleteCategory', () => {
    it('should delegate to categoriesService.deleteCategory and return null data with message', async () => {
      mockCategoriesService.deleteCategory.mockResolvedValue(undefined);

      const result = await controller.deleteCategory(categoryId);

      expect(mockCategoriesService.deleteCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual({ data: null, message: 'Categoría eliminada' });
    });

    it('should propagate service errors on delete', async () => {
      mockCategoriesService.deleteCategory.mockRejectedValue(new Error('Has references'));

      await expect(controller.deleteCategory(categoryId)).rejects.toThrow('Has references');
    });
  });
});
