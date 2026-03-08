import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    hardDelete: jest.Mock;
    hasReferencingTasks: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      hasReferencingTasks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: CategoriesRepository, useValue: repository }],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should delegate to repository', async () => {
      const categories = [{ id: 'cat-1', name: 'Electricidad' }];
      repository.findAll.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategory', () => {
    it('should return category when found', async () => {
      const category = { id: 'cat-1', name: 'Electricidad' };
      repository.findById.mockResolvedValue(category);

      const result = await service.getCategory('cat-1');

      expect(result).toEqual(category);
      expect(repository.findById).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getCategory('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    const dto = { name: 'Plomería', order: 1 };

    it('should create when name is unique', async () => {
      repository.findByName.mockResolvedValue(null);
      const created = { id: 'cat-new', ...dto };
      repository.create.mockResolvedValue(created);

      const result = await service.createCategory(dto);

      expect(result).toEqual(created);
      expect(repository.findByName).toHaveBeenCalledWith('Plomería');
      expect(repository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException on duplicate name', async () => {
      repository.findByName.mockResolvedValue({ id: 'cat-existing', name: 'Plomería' });

      await expect(service.createCategory(dto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update when category exists and name is unique', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.findByName.mockResolvedValue(null);
      const updated = { id: 'cat-1', name: 'Plomería' };
      repository.update.mockResolvedValue(updated);

      const result = await service.updateCategory('cat-1', { name: 'Plomería' });

      expect(result).toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith('cat-1', { name: 'Plomería' });
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updateCategory('nonexistent', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new name already taken by another category', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.findByName.mockResolvedValue({ id: 'cat-other', name: 'Plomería' });

      await expect(service.updateCategory('cat-1', { name: 'Plomería' })).rejects.toThrow(
        ConflictException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow update when name belongs to the same category', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.findByName.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      const updated = { id: 'cat-1', name: 'Electricidad' };
      repository.update.mockResolvedValue(updated);

      const result = await service.updateCategory('cat-1', { name: 'Electricidad' });

      expect(result).toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith('cat-1', { name: 'Electricidad' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete when no referencing tasks', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.hasReferencingTasks.mockResolvedValue(false);
      repository.hardDelete.mockResolvedValue(undefined);

      const result = await service.deleteCategory('cat-1');

      expect(result).toEqual({ data: null, message: 'Categoría eliminada' });
      expect(repository.hardDelete).toHaveBeenCalledWith('cat-1');
    });

    it('should throw BadRequestException when tasks exist', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.hasReferencingTasks.mockResolvedValue(true);

      await expect(service.deleteCategory('cat-1')).rejects.toThrow(BadRequestException);
      expect(repository.hardDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteCategory('nonexistent')).rejects.toThrow(NotFoundException);
      expect(repository.hardDelete).not.toHaveBeenCalled();
    });
  });
});
