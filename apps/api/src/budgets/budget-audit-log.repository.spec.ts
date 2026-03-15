import { BudgetStatus } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';

describe('BudgetAuditLogRepository', () => {
  let repository: BudgetAuditLogRepository;
  let prisma: PrismaService;

  const mockAuditLogModel = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      budgetAuditLog: mockAuditLogModel,
    } as unknown as PrismaService;

    repository = new BudgetAuditLogRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createAuditLog', () => {
    it('should create an audit log with JSON before/after values', async () => {
      const before = { status: BudgetStatus.PENDING };
      const after = { status: BudgetStatus.APPROVED };
      mockAuditLogModel.create.mockResolvedValue({
        id: 'clx1aud00000001',
        budgetId: 'clx1bdg00000001',
        userId: 'clx1usr00000001',
        action: 'STATUS_CHANGE',
        before,
        after,
      });

      await repository.createAuditLog(
        'clx1bdg00000001',
        'clx1usr00000001',
        'STATUS_CHANGE',
        before,
        after,
      );

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        data: {
          budgetId: 'clx1bdg00000001',
          userId: 'clx1usr00000001',
          action: 'STATUS_CHANGE',
          before: { status: BudgetStatus.PENDING },
          after: { status: BudgetStatus.APPROVED },
        },
      });
    });

    it('should pass all fields to prisma create', async () => {
      const before = { amount: 50000 };
      const after = { amount: 75000 };
      mockAuditLogModel.create.mockResolvedValue({ id: 'clx1aud00000002' });

      await repository.createAuditLog(
        'clx1bdg00000002',
        'clx1usr00000001',
        'AMOUNT_CHANGE',
        before,
        after,
      );

      const call = mockAuditLogModel.create.mock.calls[0][0];
      expect(call.data.budgetId).toBe('clx1bdg00000002');
      expect(call.data.userId).toBe('clx1usr00000001');
      expect(call.data.action).toBe('AMOUNT_CHANGE');
      expect(call.data.before).toEqual({ amount: 50000 });
      expect(call.data.after).toEqual({ amount: 75000 });
    });
  });

  describe('findByBudgetId', () => {
    it('should filter by budgetId', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByBudgetId('clx1bdg00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { budgetId: 'clx1bdg00000001' },
        }),
      );
    });

    it('should order by changedAt desc', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByBudgetId('clx1bdg00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { changedAt: 'desc' },
        }),
      );
    });

    it('should include user with id and name', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByBudgetId('clx1bdg00000001');

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
