import { Test, TestingModule } from '@nestjs/testing';

import { QuoteTemplatesController } from './quote-templates.controller';
import { QuoteTemplatesService } from './quote-templates.service';

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const templateId = 'template-uuid-1';
const mockUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

describe('QuoteTemplatesController', () => {
  let controller: QuoteTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteTemplatesController],
      providers: [{ provide: QuoteTemplatesService, useValue: mockService }],
    }).compile();

    controller = module.get<QuoteTemplatesController>(QuoteTemplatesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should list all quote templates', async () => {
      const templates = [
        { id: templateId, name: 'Presupuesto básico' },
        { id: 'template-uuid-2', name: 'Presupuesto completo' },
      ];
      mockService.findAll.mockResolvedValue(templates);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual({ data: templates });
    });
  });

  describe('findOne', () => {
    it('should get quote template by id', async () => {
      const template = { id: templateId, name: 'Presupuesto básico', items: [] };
      mockService.findById.mockResolvedValue(template);

      const result = await controller.findOne(templateId);

      expect(mockService.findById).toHaveBeenCalledWith(templateId);
      expect(result).toEqual({ data: template });
    });
  });

  describe('create', () => {
    it('should create quote template', async () => {
      const dto = {
        name: 'Presupuesto eléctrico',
        items: [{ description: 'Revisión tablero', quantity: 1, unitPrice: 5000 }],
      };
      const created = { id: templateId, ...dto, createdBy: mockUser.id };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any, mockUser as any);

      expect(mockService.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual({ data: created, message: 'Plantilla creada' });
    });
  });

  describe('update', () => {
    it('should update quote template', async () => {
      const dto = { name: 'Presupuesto actualizado' };
      const updated = { id: templateId, name: 'Presupuesto actualizado' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(templateId, dto as any);

      expect(mockService.update).toHaveBeenCalledWith(templateId, dto);
      expect(result).toEqual({ data: updated, message: 'Plantilla actualizada' });
    });
  });

  describe('remove', () => {
    it('should delete quote template', async () => {
      const deleteResult = { data: null, message: 'Plantilla eliminada' };
      mockService.delete.mockResolvedValue(deleteResult);

      const result = await controller.remove(templateId);

      expect(mockService.delete).toHaveBeenCalledWith(templateId);
      expect(result).toEqual(deleteResult);
    });
  });
});
