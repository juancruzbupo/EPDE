import { Test, TestingModule } from '@nestjs/testing';

import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

const mockClientsService = {
  listClients: jest.fn(),
  getClient: jest.fn(),
  createClient: jest.fn(),
  reinviteClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
};

const clientId = 'client-uuid-1';

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockClientsService }],
    })
      .overrideGuard(StrictBlacklistGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    jest.clearAllMocks();
  });

  describe('listClients', () => {
    it('should delegate to clientsService.listClients and return service result directly', async () => {
      const filters = { cursor: undefined, take: 10, status: undefined };
      const paginatedResult = { data: [], nextCursor: null };
      mockClientsService.listClients.mockResolvedValue(paginatedResult);

      const result = await controller.listClients(filters as any);

      expect(mockClientsService.listClients).toHaveBeenCalledWith(filters);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass filters through to the service unchanged', async () => {
      const filters = { cursor: 'abc', take: 20, status: 'ACTIVE' };
      mockClientsService.listClients.mockResolvedValue({ data: [], nextCursor: null });

      await controller.listClients(filters as any);

      expect(mockClientsService.listClients).toHaveBeenCalledWith(filters);
    });
  });

  describe('getClient', () => {
    it('should delegate to clientsService.getClient and return wrapped data', async () => {
      const client = { id: clientId, firstName: 'Juan', lastName: 'Perez' };
      mockClientsService.getClient.mockResolvedValue(client);

      const result = await controller.getClient(clientId);

      expect(mockClientsService.getClient).toHaveBeenCalledWith(clientId);
      expect(result).toEqual({ data: client });
    });
  });

  describe('createClient', () => {
    it('should delegate to clientsService.createClient and return wrapped data with message', async () => {
      const dto = { firstName: 'Maria', lastName: 'Lopez', email: 'maria@test.com' };
      const created = { id: clientId, ...dto };
      mockClientsService.createClient.mockResolvedValue(created);

      const result = await controller.createClient(dto as any);

      expect(mockClientsService.createClient).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ data: created, message: 'Cliente creado e invitación enviada' });
    });

    it('should propagate service errors on create', async () => {
      const dto = { firstName: 'Dup', lastName: 'User', email: 'dup@test.com' };
      mockClientsService.createClient.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.createClient(dto as any)).rejects.toThrow('Email already exists');
    });
  });

  describe('reinviteClient', () => {
    it('should delegate to clientsService.reinviteClient and return wrapped data with message', async () => {
      const reinvited = { id: clientId, email: 'maria@test.com' };
      mockClientsService.reinviteClient.mockResolvedValue(reinvited);

      const result = await controller.reinviteClient(clientId);

      expect(mockClientsService.reinviteClient).toHaveBeenCalledWith(clientId);
      expect(result).toEqual({ data: reinvited, message: 'Invitación reenviada' });
    });

    it('should propagate service errors on reinvite', async () => {
      mockClientsService.reinviteClient.mockRejectedValue(new Error('Client not found'));

      await expect(controller.reinviteClient(clientId)).rejects.toThrow('Client not found');
    });
  });

  describe('updateClient', () => {
    it('should delegate to clientsService.updateClient with id and dto and return wrapped data with message', async () => {
      const dto = { firstName: 'Maria Actualizada' };
      const updated = { id: clientId, firstName: 'Maria Actualizada', lastName: 'Lopez' };
      mockClientsService.updateClient.mockResolvedValue(updated);

      const result = await controller.updateClient(clientId, dto as any);

      expect(mockClientsService.updateClient).toHaveBeenCalledWith(clientId, dto);
      expect(result).toEqual({ data: updated, message: 'Cliente actualizado' });
    });
  });

  describe('deleteClient', () => {
    it('should delegate to clientsService.deleteClient and return service result directly', async () => {
      const deleteResult = { data: null, message: 'Cliente eliminado' };
      mockClientsService.deleteClient.mockResolvedValue(deleteResult);

      const result = await controller.deleteClient(clientId);

      expect(mockClientsService.deleteClient).toHaveBeenCalledWith(clientId);
      expect(result).toEqual(deleteResult);
    });

    it('should propagate service errors on delete', async () => {
      mockClientsService.deleteClient.mockRejectedValue(new Error('Cannot delete'));

      await expect(controller.deleteClient(clientId)).rejects.toThrow('Cannot delete');
    });
  });
});
