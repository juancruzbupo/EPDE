import { ServiceRequestsRepository } from './service-requests.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ServiceRequestsRepository', () => {
  let repository: ServiceRequestsRepository;
  let prisma: PrismaService;

  const mockModel = {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTx = {
    serviceRequest: { create: jest.fn(), findUnique: jest.fn() },
    serviceRequestPhoto: { createMany: jest.fn() },
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>, _opts?: unknown) =>
        cb(mockTx),
      ),
      softDelete: { serviceRequest: mockModel },
      serviceRequest: mockModel,
    } as unknown as PrismaService;

    repository = new ServiceRequestsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createWithPhotos', () => {
    const data = {
      propertyId: 'prop-1',
      requestedBy: 'user-1',
      title: 'Pérdida de agua',
      description: 'Hay una pérdida en la cocina',
      urgency: 'HIGH' as const,
      createdBy: 'user-1',
    };

    it('should create service request in a transaction with 30s timeout', async () => {
      mockTx.serviceRequest.create.mockResolvedValue({ id: 'sr-1' });
      mockTx.serviceRequest.findUnique.mockResolvedValue({ id: 'sr-1' });

      await repository.createWithPhotos(data);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 30000 });
    });

    it('should create photos when photoUrls provided', async () => {
      const photoUrls = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
      mockTx.serviceRequest.create.mockResolvedValue({ id: 'sr-1' });
      mockTx.serviceRequest.findUnique.mockResolvedValue({ id: 'sr-1', photos: [] });

      await repository.createWithPhotos({ ...data, photoUrls });

      expect(mockTx.serviceRequestPhoto.createMany).toHaveBeenCalledWith({
        data: [
          { serviceRequestId: 'sr-1', url: 'https://example.com/1.jpg' },
          { serviceRequestId: 'sr-1', url: 'https://example.com/2.jpg' },
        ],
      });
    });

    it('should skip photo creation when no photoUrls', async () => {
      mockTx.serviceRequest.create.mockResolvedValue({ id: 'sr-1' });
      mockTx.serviceRequest.findUnique.mockResolvedValue({ id: 'sr-1' });

      await repository.createWithPhotos(data);

      expect(mockTx.serviceRequestPhoto.createMany).not.toHaveBeenCalled();
    });

    it('should return service request with includes', async () => {
      mockTx.serviceRequest.create.mockResolvedValue({ id: 'sr-1' });
      mockTx.serviceRequest.findUnique.mockResolvedValue({ id: 'sr-1', property: {}, photos: [] });

      await repository.createWithPhotos(data);

      expect(mockTx.serviceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'sr-1' },
        include: {
          property: { select: { id: true, address: true, city: true } },
          requester: { select: { id: true, name: true } },
          photos: true,
        },
      });
    });
  });

  describe('findRequests', () => {
    it('should filter by status when provided', async () => {
      await repository.findRequests({ status: 'OPEN' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN' }),
        }),
      );
    });

    it('should filter by urgency when provided', async () => {
      await repository.findRequests({ urgency: 'HIGH' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ urgency: 'HIGH' }),
        }),
      );
    });

    it('should filter by propertyId when provided', async () => {
      await repository.findRequests({ propertyId: 'prop-1' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ propertyId: 'prop-1' }),
        }),
      );
    });

    it('should filter by userId as requestedBy', async () => {
      await repository.findRequests({ userId: 'user-1' });

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ requestedBy: 'user-1' }),
        }),
      );
    });
  });

  describe('findByIdWithDetails', () => {
    it('should return request with photos included', async () => {
      mockModel.findUnique.mockResolvedValue({ id: 'sr-1', photos: [] });

      const result = await repository.findByIdWithDetails('sr-1');

      expect(result).toBeDefined();
    });

    it('should return null when not found', async () => {
      mockModel.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithDetails('missing');

      expect(result).toBeNull();
    });
  });
});
