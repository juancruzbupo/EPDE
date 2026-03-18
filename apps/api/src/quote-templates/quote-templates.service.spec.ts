import { NotFoundException } from '@nestjs/common';

import { QuoteTemplatesService } from './quote-templates.service';

describe('QuoteTemplatesService', () => {
  let service: QuoteTemplatesService;
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new QuoteTemplatesService(repository as never);
  });

  describe('findAll', () => {
    it('should delegate to repository', async () => {
      const templates = [{ id: '1', name: 'Template' }];
      repository.findAll.mockResolvedValue(templates);
      const result = await service.findAll();
      expect(result).toEqual(templates);
    });
  });

  describe('findById', () => {
    it('should return template when found', async () => {
      const template = { id: '1', name: 'Template' };
      repository.findById.mockResolvedValue(template);
      const result = await service.findById('1');
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create with user id as createdBy', async () => {
      const dto = { name: 'New', items: [{ description: 'Item', quantity: 1, unitPrice: 100 }] };
      const user = { id: 'user-1', email: 'a@b.com', role: 'ADMIN' } as never;
      const created = { id: '1', ...dto };
      repository.create.mockResolvedValue(created);

      const result = await service.create(dto, user);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'New',
        createdBy: 'user-1',
        items: dto.items,
      });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update existing template', async () => {
      repository.findById.mockResolvedValue({ id: '1', name: 'Old' });
      repository.update.mockResolvedValue({ id: '1', name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' });
      expect(result).toEqual({ id: '1', name: 'Updated' });
    });

    it('should throw NotFoundException if template not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('bad', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete existing template and return envelope', async () => {
      repository.findById.mockResolvedValue({ id: '1' });
      repository.delete.mockResolvedValue(undefined);

      await service.delete('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if template not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.delete('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
