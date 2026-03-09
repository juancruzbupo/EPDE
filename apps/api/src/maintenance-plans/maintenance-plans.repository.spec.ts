import { PrismaService } from '../prisma/prisma.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';

describe('MaintenancePlansRepository', () => {
  let repository: MaintenancePlansRepository;

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
    const prisma = {
      maintenancePlan: mockModel,
    } as unknown as PrismaService;

    repository = new MaintenancePlansRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should include property select and _count with deletedAt null filter', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findAll();

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          property: {
            select: { id: true, address: true, city: true, userId: true },
          },
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by property.userId when userId provided', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findAll('user-1');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { property: { userId: 'user-1' } },
        }),
      );
    });

    it('should return all plans when no userId provided', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findAll();

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('findByPropertyId', () => {
    it('should filter tasks by deletedAt null and include category', async () => {
      mockModel.findFirst.mockResolvedValue({ id: 'plan-1' });

      await repository.findByPropertyId('prop-1');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { propertyId: 'prop-1' },
        include: {
          tasks: {
            where: { deletedAt: null },
            include: { category: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  });

  describe('findWithProperty', () => {
    it('should select property.userId', async () => {
      mockModel.findFirst.mockResolvedValue({ id: 'plan-1', property: { userId: 'user-1' } });

      await repository.findWithProperty('plan-1');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: { property: { select: { userId: true } } },
      });
    });
  });

  describe('findWithFullDetails', () => {
    it('should use fullDetailsInclude constant', async () => {
      mockModel.findFirst.mockResolvedValue({ id: 'plan-1' });

      await repository.findWithFullDetails('plan-1');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: expect.objectContaining({
          property: expect.objectContaining({
            include: expect.objectContaining({
              user: { select: { id: true, name: true, email: true } },
            }),
          }),
          tasks: expect.objectContaining({
            where: { deletedAt: null },
            include: { category: true },
            orderBy: { order: 'asc' },
          }),
        }),
      });
    });

    it('should return null when not found', async () => {
      mockModel.findFirst.mockResolvedValue(null);

      const result = await repository.findWithFullDetails('missing');

      expect(result).toBeNull();
    });
  });
});
