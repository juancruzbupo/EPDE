import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryTemplatesService } from './category-templates.service';
import { CategoryTemplatesRepository } from './category-templates.repository';

describe('CategoryTemplatesService', () => {
  let service: CategoryTemplatesService;
  let repository: {
    findMany: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    hardDelete: jest.Mock;
    reorder: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryTemplatesService,
        { provide: CategoryTemplatesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<CategoryTemplatesService>(CategoryTemplatesService);
  });

  describe('list', () => {
    it('should return paginated templates with tasks', async () => {
      const templates = {
        data: [
          { id: 'cat-1', name: 'Techos', tasks: [{ id: 't-1', name: 'Inspección' }] },
          { id: 'cat-2', name: 'Electricidad', tasks: [] },
        ],
        nextCursor: 'cat-2',
      };
      repository.findMany.mockResolvedValue(templates);

      const result = await service.list({ cursor: undefined, take: 10 });

      expect(result).toEqual(templates);
      expect(repository.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        take: 10,
        include: { tasks: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('getById', () => {
    it('should return template when found', async () => {
      const template = { id: 'cat-1', name: 'Techos', tasks: [] };
      repository.findById.mockResolvedValue(template);

      const result = await service.getById('cat-1');

      expect(result).toEqual(template);
      expect(repository.findById).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create template with data', async () => {
      const data = { name: 'Plomería', description: 'Instalaciones de agua' };
      const created = { id: 'cat-new', ...data, displayOrder: 0 };

      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(repository.findByName).toHaveBeenCalledWith('Plomería');
      expect(repository.create).toHaveBeenCalledWith(data);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const existing = { id: 'cat-1', name: 'Techos' };
      repository.findByName.mockResolvedValue(existing);

      await expect(service.create({ name: 'Techos' })).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update template', async () => {
      const template = { id: 'cat-1', name: 'Techos' };
      const updateData = { name: 'Techos y Cubiertas' };
      const updated = { id: 'cat-1', name: 'Techos y Cubiertas' };

      repository.findById.mockResolvedValue(template);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue(updated);

      const result = await service.update('cat-1', updateData);

      expect(result).toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith('cat-1', updateData);
    });

    it('should throw ConflictException on duplicate name (excluding self)', async () => {
      const template = { id: 'cat-1', name: 'Techos' };
      const otherTemplate = { id: 'cat-2', name: 'Electricidad' };

      repository.findById.mockResolvedValue(template);
      repository.findByName.mockResolvedValue(otherTemplate);

      await expect(service.update('cat-1', { name: 'Electricidad' })).rejects.toThrow(
        ConflictException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow update with same name (own name)', async () => {
      const template = { id: 'cat-1', name: 'Techos' };

      repository.findById.mockResolvedValue(template);
      repository.findByName.mockResolvedValue(template); // Same entity
      repository.update.mockResolvedValue(template);

      const result = await service.update('cat-1', { name: 'Techos' });

      expect(result).toEqual(template);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when template not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete template', async () => {
      repository.findById.mockResolvedValue({ id: 'cat-1', name: 'Techos' });
      repository.hardDelete.mockResolvedValue({});

      const result = await service.remove('cat-1');

      expect(result).toEqual({ message: 'Categoría template eliminada' });
      expect(repository.hardDelete).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should call repository reorder with ids array', async () => {
      repository.reorder.mockResolvedValue([]);

      const ids = ['cat-3', 'cat-1', 'cat-2'];
      const result = await service.reorder(ids);

      expect(result).toEqual({ message: 'Orden actualizado' });
      expect(repository.reorder).toHaveBeenCalledWith(ids);
    });
  });
});
