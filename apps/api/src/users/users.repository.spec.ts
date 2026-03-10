import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;

  const mockUserModel = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockSoftDeleteUserModel = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(() => {
    const prisma = {
      user: mockUserModel,
      softDelete: { user: mockSoftDeleteUserModel },
    } as unknown as PrismaService;

    repository = new UsersRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      mockSoftDeleteUserModel.findFirst.mockResolvedValue(user);

      const result = await repository.findByEmail('test@example.com');

      expect(mockSoftDeleteUserModel.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when email not found', async () => {
      mockSoftDeleteUserModel.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('inherited BaseRepository methods', () => {
    it('should find by id via soft-delete model', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      mockSoftDeleteUserModel.findUnique.mockResolvedValue(user);

      const result = await repository.findById('user-1');

      expect(mockSoftDeleteUserModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when id not found', async () => {
      mockSoftDeleteUserModel.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should update via write model', async () => {
      const updated = { id: 'user-1', name: 'Updated' };
      mockUserModel.update.mockResolvedValue(updated);

      const result = await repository.update('user-1', { name: 'Updated' });

      expect(mockUserModel.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated' },
      });
      expect(result).toEqual(updated);
    });
  });
});
