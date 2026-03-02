import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@epde/shared';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: usersRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = {
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
      };
      usersRepository.findById.mockResolvedValue(user);

      const result = await service.findById('client-1');

      expect(result).toEqual(user);
      expect(usersRepository.findById).toHaveBeenCalledWith('client-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return admin user when found', async () => {
      const admin = {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@epde.com',
        role: UserRole.ADMIN,
      };
      usersRepository.findById.mockResolvedValue(admin);

      const result = await service.findById('admin-1');

      expect(result).toEqual(admin);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      const user = {
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
      };
      usersRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('juan@test.com');

      expect(result).toEqual(user);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith('juan@test.com');
    });

    it('should return null when email not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('noexiste@test.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'nuevo@test.com',
        name: 'Nuevo Usuario',
        role: UserRole.CLIENT,
        status: 'ACTIVE' as const,
        passwordHash: 'hashed-password',
      };
      const createdUser = { id: 'new-user-1', ...createData };
      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.create(createData);

      expect(result).toEqual(createdUser);
      expect(usersRepository.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updateData = { name: 'Juan Actualizado', phone: '+5411999888' };
      const updatedUser = {
        id: 'client-1',
        name: 'Juan Actualizado',
        phone: '+5411999888',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
      };
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('client-1', updateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith('client-1', updateData);
    });

    it('should update user status', async () => {
      const updateData = { status: 'ACTIVE' as const };
      const updatedUser = {
        id: 'client-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: UserRole.CLIENT,
        status: 'ACTIVE',
      };
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('client-1', updateData);

      expect(result).toEqual(updatedUser);
      expect(result.status).toBe('ACTIVE');
    });
  });
});
