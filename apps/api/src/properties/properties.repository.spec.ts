import { PlanStatus } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { PropertiesRepository } from './properties.repository';

describe('PropertiesRepository', () => {
  let repository: PropertiesRepository;
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
      $transaction: jest.fn(),
      softDelete: { property: mockModel },
      property: mockModel,
    } as unknown as PrismaService;

    repository = new PropertiesRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createWithPlan', () => {
    const data = {
      userId: 'user-1',
      address: 'Av. Rivadavia 1234',
      city: 'Paraná',
      type: 'HOUSE' as const,
      createdBy: 'admin-1',
    };

    it('should create property with user and plan includes', async () => {
      mockModel.create.mockResolvedValue({
        id: 'prop-1',
        ...data,
        user: {},
        maintenancePlan: null,
      });

      const result = await repository.createWithPlan(data);

      expect(mockModel.create).toHaveBeenCalledWith({
        data,
        include: {
          user: { select: { id: true, name: true, email: true } },
          maintenancePlan: true,
        },
      });
      expect(result).toEqual({ id: 'prop-1', ...data, user: {}, maintenancePlan: null });
    });
  });

  describe('findProperties', () => {
    beforeEach(() => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);
    });

    it('should filter by userId when provided', async () => {
      await repository.findProperties({ userId: 'user-1' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should filter by city with insensitive contains', async () => {
      await repository.findProperties({ city: 'Paraná' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { contains: 'Paraná', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by type when provided', async () => {
      await repository.findProperties({ type: 'HOUSE' as const });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'HOUSE' }),
        }),
      );
    });

    it('should apply search across address and city via OR', async () => {
      await repository.findProperties({ search: 'Rivadavia' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { address: { contains: 'Rivadavia', mode: 'insensitive' } },
              { city: { contains: 'Rivadavia', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should combine multiple filters', async () => {
      await repository.findProperties({ userId: 'user-1', city: 'Paraná', type: 'HOUSE' as const });

      const call = mockModel.findMany.mock.calls[0][0];
      expect(call.where).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          city: { contains: 'Paraná', mode: 'insensitive' },
          type: 'HOUSE',
        }),
      );
    });
  });

  describe('findWithPlan', () => {
    it('should include user, maintenancePlan with tasks and categories', async () => {
      mockModel.findFirst.mockResolvedValue({ id: 'prop-1' });

      await repository.findWithPlan('prop-1');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          maintenancePlan: {
            include: {
              tasks: { include: { category: true }, orderBy: { order: 'asc' }, take: 500 },
            },
          },
        },
      });
    });

    it('should return null when not found', async () => {
      mockModel.findFirst.mockResolvedValue(null);
      expect(await repository.findWithPlan('missing')).toBeNull();
    });
  });

  describe('findOwnership', () => {
    it('should select only id and userId', async () => {
      mockModel.findUnique.mockResolvedValue({ id: 'prop-1', userId: 'user-1' });

      await repository.findOwnership('prop-1');

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        select: { id: true, userId: true },
      });
    });
  });

  describe('findByUserId', () => {
    it('should filter by userId and order by createdAt desc', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1');

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { maintenancePlan: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findWithActivePlans', () => {
    it('should query non-deleted properties with active plans and bounded take', async () => {
      const mockProperty = {
        property: { findMany: jest.fn().mockResolvedValue([{ id: 'prop-1' }]) },
      };
      (prisma as unknown as { property: { findMany: jest.Mock } }).property = mockProperty.property;

      await repository.findWithActivePlans(50);

      expect(mockProperty.property.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, maintenancePlan: { status: PlanStatus.ACTIVE } },
        select: {
          id: true,
          address: true,
          userId: true,
          maintenancePlan: { select: { id: true } },
        },
        take: 50,
      });
    });
  });
});
