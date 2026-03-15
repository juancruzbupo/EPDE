import { ServiceStatus } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestAuditLogRepository } from './service-request-audit-log.repository';

describe('ServiceRequestAuditLogRepository', () => {
  let repository: ServiceRequestAuditLogRepository;
  let prisma: PrismaService;

  const mockAuditLogModel = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      serviceRequestAuditLog: mockAuditLogModel,
    } as unknown as PrismaService;

    repository = new ServiceRequestAuditLogRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createAuditLog', () => {
    it('should create an audit log with JSON before/after values', async () => {
      const before = { status: ServiceStatus.OPEN };
      const after = { status: ServiceStatus.IN_PROGRESS };
      mockAuditLogModel.create.mockResolvedValue({
        id: 'clx1aud00000001',
        serviceRequestId: 'clx1srv00000001',
        userId: 'clx1usr00000001',
        action: 'STATUS_CHANGE',
        before,
        after,
      });

      await repository.createAuditLog(
        'clx1srv00000001',
        'clx1usr00000001',
        'STATUS_CHANGE',
        before,
        after,
      );

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        data: {
          serviceRequestId: 'clx1srv00000001',
          userId: 'clx1usr00000001',
          action: 'STATUS_CHANGE',
          before: { status: ServiceStatus.OPEN },
          after: { status: ServiceStatus.IN_PROGRESS },
        },
      });
    });

    it('should pass all fields to prisma create', async () => {
      const before = { urgency: 'LOW' };
      const after = { urgency: 'HIGH' };
      mockAuditLogModel.create.mockResolvedValue({ id: 'clx1aud00000002' });

      await repository.createAuditLog(
        'clx1srv00000002',
        'clx1usr00000001',
        'URGENCY_CHANGE',
        before,
        after,
      );

      const call = mockAuditLogModel.create.mock.calls[0][0];
      expect(call.data.serviceRequestId).toBe('clx1srv00000002');
      expect(call.data.userId).toBe('clx1usr00000001');
      expect(call.data.action).toBe('URGENCY_CHANGE');
      expect(call.data.before).toEqual({ urgency: 'LOW' });
      expect(call.data.after).toEqual({ urgency: 'HIGH' });
    });
  });

  describe('findByServiceRequestId', () => {
    it('should filter by serviceRequestId', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceRequestId: 'clx1srv00000001' },
        }),
      );
    });

    it('should order by changedAt desc', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { changedAt: 'desc' },
        }),
      );
    });

    it('should include user with id and name', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
      );
    });
  });
});
