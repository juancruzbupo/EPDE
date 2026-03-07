import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@epde/shared';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './clients.repository';
import { EmailQueueService } from '../email/email-queue.service';
describe('ClientsService', () => {
  let service: ClientsService;
  let clientsRepository: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    findByEmailIncludingDeleted: jest.Mock;
    findClients: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let emailQueueService: {
    enqueueInvite: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    clientsRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailIncludingDeleted: jest.fn(),
      findClients: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    emailQueueService = {
      enqueueInvite: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: ClientsRepository, useValue: clientsRepository },
        { provide: EmailQueueService, useValue: emailQueueService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  describe('listClients', () => {
    it('should return paginated clients', async () => {
      const paginatedResult = {
        data: [
          { id: 'c-1', name: 'Juan', email: 'juan@test.com', role: UserRole.CLIENT },
          { id: 'c-2', name: 'Maria', email: 'maria@test.com', role: UserRole.CLIENT },
        ],
        nextCursor: null,
        hasMore: false,
        total: 2,
      };
      clientsRepository.findClients.mockResolvedValue(paginatedResult);

      const filters = { cursor: undefined, take: 10, search: undefined, status: undefined };
      const result = await service.listClients(filters);

      expect(result).toEqual(paginatedResult);
      expect(clientsRepository.findClients).toHaveBeenCalledWith({
        cursor: undefined,
        take: 10,
        search: undefined,
        status: undefined,
      });
    });

    it('should pass search and status filters', async () => {
      clientsRepository.findClients.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      });

      const filters = { cursor: undefined, take: 20, search: 'juan', status: 'ACTIVE' as const };
      await service.listClients(filters);

      expect(clientsRepository.findClients).toHaveBeenCalledWith({
        cursor: undefined,
        take: 20,
        search: 'juan',
        status: 'ACTIVE',
      });
    });
  });

  describe('getClient', () => {
    it('should return client without password hash', async () => {
      const client = {
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
        passwordHash: 'hashed-password',
      };
      clientsRepository.findById.mockResolvedValue(client);

      const result = await service.getClient('client-1');

      expect(result).toEqual({
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when client not found', async () => {
      clientsRepository.findById.mockResolvedValue(null);

      await expect(service.getClient('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not a CLIENT', async () => {
      const admin = {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        passwordHash: 'hashed',
      };
      clientsRepository.findById.mockResolvedValue(admin);

      await expect(service.getClient('admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createClient', () => {
    const dto = {
      email: 'nuevo@test.com',
      name: 'Nuevo Cliente',
      phone: '+5411123456',
    };

    it('should create client, sign JWT and enqueue invite email', async () => {
      clientsRepository.findByEmailIncludingDeleted.mockResolvedValue(null);

      const createdClient = {
        id: 'client-new',
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CLIENT,
        status: 'INVITED',
        passwordHash: null,
      };
      clientsRepository.create.mockResolvedValue(createdClient);
      jwtService.sign.mockReturnValue('invite-token-123');
      emailQueueService.enqueueInvite.mockResolvedValue(undefined);

      const result = await service.createClient(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(dto.email);
      expect(clientsRepository.create).toHaveBeenCalledWith({
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CLIENT,
        status: 'INVITED',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'client-new', email: dto.email, purpose: 'invite' },
        { expiresIn: '24h' },
      );
      expect(emailQueueService.enqueueInvite).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        'invite-token-123',
      );
    });

    it('should throw ConflictException if email already exists and not deleted', async () => {
      clientsRepository.findByEmailIncludingDeleted.mockResolvedValue({
        id: 'existing',
        email: dto.email,
        deletedAt: null,
      });

      await expect(service.createClient(dto)).rejects.toThrow(ConflictException);
      expect(clientsRepository.create).not.toHaveBeenCalled();
    });

    it('should reactivate soft-deleted user with same email', async () => {
      const deletedUser = {
        id: 'deleted-1',
        email: dto.email,
        name: 'Old Name',
        deletedAt: new Date('2025-01-01'),
        passwordHash: 'old-hash',
      };
      clientsRepository.findByEmailIncludingDeleted.mockResolvedValue(deletedUser);

      const reactivatedClient = {
        id: 'deleted-1',
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        status: 'INVITED',
        passwordHash: null,
        deletedAt: null,
      };
      clientsRepository.update.mockResolvedValue(reactivatedClient);
      jwtService.sign.mockReturnValue('reactivate-token');
      emailQueueService.enqueueInvite.mockResolvedValue(undefined);

      const result = await service.createClient(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(clientsRepository.update).toHaveBeenCalledWith('deleted-1', {
        name: dto.name,
        phone: dto.phone,
        status: 'INVITED',
        passwordHash: null,
        deletedAt: null,
      });
      expect(clientsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateClient', () => {
    it('should update client and return without password hash', async () => {
      const client = {
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
        passwordHash: 'hashed',
      };
      clientsRepository.findById.mockResolvedValue(client);

      const updatedClient = {
        ...client,
        name: 'Juan Updated',
        passwordHash: 'hashed',
      };
      clientsRepository.update.mockResolvedValue(updatedClient);

      const result = await service.updateClient('client-1', { name: 'Juan Updated' });

      expect(result.name).toBe('Juan Updated');
      expect(result).not.toHaveProperty('passwordHash');
      expect(clientsRepository.update).toHaveBeenCalledWith('client-1', { name: 'Juan Updated' });
    });

    it('should throw NotFoundException when client not found', async () => {
      clientsRepository.findById.mockResolvedValue(null);

      await expect(service.updateClient('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      expect(clientsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not a CLIENT', async () => {
      clientsRepository.findById.mockResolvedValue({
        id: 'admin-1',
        role: UserRole.ADMIN,
        passwordHash: 'hashed',
      });

      await expect(service.updateClient('admin-1', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteClient', () => {
    it('should soft delete the client', async () => {
      clientsRepository.findById.mockResolvedValue({
        id: 'client-1',
        role: UserRole.CLIENT,
        passwordHash: 'hashed',
      });
      clientsRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteClient('client-1');

      expect(result).toEqual({ data: null, message: 'Cliente eliminado' });
      expect(clientsRepository.softDelete).toHaveBeenCalledWith('client-1');
    });

    it('should throw NotFoundException when client not found', async () => {
      clientsRepository.findById.mockResolvedValue(null);

      await expect(service.deleteClient('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should delegate to repository', async () => {
      const user = { id: 'client-1', email: 'juan@test.com' };
      clientsRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('juan@test.com');

      expect(result).toEqual(user);
      expect(clientsRepository.findByEmail).toHaveBeenCalledWith('juan@test.com');
    });

    it('should return null when email not found', async () => {
      clientsRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('noexiste@test.com');

      expect(result).toBeNull();
    });
  });
});
