import { ClientsRepository } from './clients.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientsRepository', () => {
  let repository: ClientsRepository;
  let prisma: PrismaService;

  const mockModel = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      softDelete: { user: mockModel },
      user: mockModel,
    } as unknown as PrismaService;

    repository = new ClientsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByEmail', () => {
    it('should find client by email using soft-delete model', async () => {
      const user = { id: 'clx1user0000001', email: 'juan@example.com' };
      mockModel.findFirst.mockResolvedValue(user);

      const result = await repository.findByEmail('juan@example.com');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
      expect(result).toEqual(user);
    });
  });

  describe('findByEmailIncludingDeleted', () => {
    it('should use writeModel to include soft-deleted users', async () => {
      const user = { id: 'clx1user0000001', email: 'deleted@example.com', deletedAt: new Date() };
      mockModel.findFirst.mockResolvedValue(user);

      const result = await repository.findByEmailIncludingDeleted('deleted@example.com');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { email: 'deleted@example.com' },
      });
      expect(result).toEqual(user);
    });
  });

  describe('findClients', () => {
    beforeEach(() => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);
    });

    it('should filter by role CLIENT with cursor pagination', async () => {
      await repository.findClients({});

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'CLIENT' }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      await repository.findClients({ status: 'ACTIVE' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'CLIENT', status: 'ACTIVE' }),
        }),
      );
    });

    it('should apply search across name and email via OR', async () => {
      await repository.findClients({ search: 'juan' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'CLIENT',
            OR: [
              { name: { contains: 'juan', mode: 'insensitive' } },
              { email: { contains: 'juan', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should apply cursor when provided', async () => {
      await repository.findClients({ cursor: 'clx1user0000005' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'clx1user0000005' },
          skip: 1,
        }),
      );
    });

    it('should return hasMore true when items exceed take', async () => {
      const items = Array.from({ length: 21 }, (_, i) => ({
        id: `clx1user${String(i).padStart(7, '0')}`,
      }));
      mockModel.findMany.mockResolvedValue(items);
      mockModel.count.mockResolvedValue(30);

      const result = await repository.findClients({ take: 20 });

      expect(result.hasMore).toBe(true);
      expect(result.data).toHaveLength(20);
    });

    it('should return hasMore false when items do not exceed take', async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: `clx1user${String(i).padStart(7, '0')}`,
      }));
      mockModel.findMany.mockResolvedValue(items);
      mockModel.count.mockResolvedValue(5);

      const result = await repository.findClients({ take: 20 });

      expect(result.hasMore).toBe(false);
      expect(result.data).toHaveLength(5);
    });

    it('should include total count by default', async () => {
      mockModel.count.mockResolvedValue(42);
      mockModel.findMany.mockResolvedValue([]);

      const result = await repository.findClients({});

      expect(mockModel.count).toHaveBeenCalled();
      expect(result.total).toBe(42);
    });

    it('should create a client via writeModel', async () => {
      const data = { name: 'Juan Pérez', email: 'juan@example.com', role: 'CLIENT' as const };
      mockModel.create.mockResolvedValue({ id: 'clx1user0000001', ...data });

      const result = await repository.create(data);

      expect(mockModel.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(expect.objectContaining({ name: 'Juan Pérez' }));
    });

    it('should update a client by id', async () => {
      const updated = { id: 'clx1user0000001', name: 'Juan P. Rodríguez' };
      mockModel.update.mockResolvedValue(updated);

      const result = await repository.update('clx1user0000001', { name: 'Juan P. Rodríguez' });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1user0000001' },
        data: { name: 'Juan P. Rodríguez' },
      });
      expect(result).toEqual(updated);
    });
  });
});
