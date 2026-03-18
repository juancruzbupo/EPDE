import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { TaskTemplatesRepository } from './task-templates.repository';
import { TaskTemplatesService } from './task-templates.service';

describe('TaskTemplatesService', () => {
  let service: TaskTemplatesService;
  let repository: {
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    hardDelete: jest.Mock;
    reorder: jest.Mock;
  };
  let categoryTemplatesRepository: {
    findById: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      reorder: jest.fn(),
    };

    categoryTemplatesRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskTemplatesService,
        { provide: TaskTemplatesRepository, useValue: repository },
        { provide: CategoryTemplatesRepository, useValue: categoryTemplatesRepository },
      ],
    }).compile();

    service = module.get<TaskTemplatesService>(TaskTemplatesService);
  });

  describe('create', () => {
    // Minimal dto — defaults (priority, professionalRequirement, etc.) are applied by ZodValidationPipe before reaching service
    const dto = {
      name: 'Revisar tablero',
      recurrenceType: 'ANNUAL' as const,
    } as import('@epde/shared').CreateTaskTemplateInput;

    it('should create when category exists', async () => {
      categoryTemplatesRepository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      const created = { id: 'task-new', ...dto, categoryId: 'cat-1' };
      repository.create.mockResolvedValue(created);

      const result = await service.create('cat-1', dto);

      expect(result).toEqual(created);
      expect(categoryTemplatesRepository.findById).toHaveBeenCalledWith('cat-1');
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        category: { connect: { id: 'cat-1' } },
      });
    });

    it('should throw NotFoundException when category missing', async () => {
      categoryTemplatesRepository.findById.mockResolvedValue(null);

      await expect(service.create('nonexistent', dto)).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const dto = { name: 'Revisar disyuntor' };

    it('should update when template exists', async () => {
      repository.findById.mockResolvedValue({ id: 'task-1', name: 'Revisar tablero' });
      const updated = { id: 'task-1', ...dto };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('task-1', dto);

      expect(result).toEqual(updated);
      expect(repository.findById).toHaveBeenCalledWith('task-1');
      expect(repository.update).toHaveBeenCalledWith('task-1', dto);
    });

    it('should throw NotFoundException when template not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', dto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete when template exists', async () => {
      repository.findById.mockResolvedValue({ id: 'task-1', name: 'Revisar tablero' });
      repository.hardDelete.mockResolvedValue(undefined);

      await service.remove('task-1');

      expect(repository.hardDelete).toHaveBeenCalledWith('task-1');
    });

    it('should throw NotFoundException when template not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
      expect(repository.hardDelete).not.toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    const ids = ['task-2', 'task-1', 'task-3'];

    it('should reorder when category exists', async () => {
      categoryTemplatesRepository.findById.mockResolvedValue({ id: 'cat-1', name: 'Electricidad' });
      repository.reorder.mockResolvedValue(undefined);

      const result = await service.reorder('cat-1', ids);

      expect(result).toEqual({ data: null, message: 'Orden actualizado' });
      expect(categoryTemplatesRepository.findById).toHaveBeenCalledWith('cat-1');
      expect(repository.reorder).toHaveBeenCalledWith('cat-1', ids);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryTemplatesRepository.findById.mockResolvedValue(null);

      await expect(service.reorder('nonexistent', ids)).rejects.toThrow(NotFoundException);
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });
});
