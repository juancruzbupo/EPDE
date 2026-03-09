import {
  BudgetNotPendingError,
  BudgetVersionConflictError,
} from '../common/exceptions/domain.exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsRepository } from './budgets.repository';

describe('BudgetsRepository', () => {
  let repository: BudgetsRepository;
  let prisma: PrismaService;

  const mockTx = {
    budgetRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    budgetLineItem: { createMany: jest.fn() },
    budgetResponse: { create: jest.fn() },
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
      budgetRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService;

    repository = new BudgetsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  const lineItems = [{ description: 'Item 1', quantity: 2, unitPrice: 100 }];
  const response = { totalAmount: 200, updatedBy: 'admin-1' };

  describe('respondToBudget', () => {
    it('should succeed when budget is PENDING and version matches', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'PENDING',
        version: 1,
      });
      mockTx.budgetRequest.update.mockResolvedValue({ id: 'b1', status: 'QUOTED' });
      mockTx.budgetLineItem.createMany.mockResolvedValue({ count: 1 });
      mockTx.budgetResponse.create.mockResolvedValue({ id: 'r1' });

      const result = await repository.respondToBudget('b1', 1, lineItems, response);

      expect(result).toEqual({ id: 'b1', status: 'QUOTED' });
      expect(mockTx.budgetLineItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ budgetRequestId: 'b1', description: 'Item 1' }),
        ]),
      });
      expect(mockTx.budgetResponse.create).toHaveBeenCalled();
      expect(mockTx.budgetRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'b1' },
          data: expect.objectContaining({ status: 'QUOTED', version: { increment: 1 } }),
        }),
      );
    });

    it('should throw BudgetNotPendingError when budget is not PENDING', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'QUOTED',
        version: 1,
      });

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetNotPendingError,
      );
    });

    it('should throw BudgetNotPendingError when budget not found', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue(null);

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetNotPendingError,
      );
    });

    it('should throw BudgetVersionConflictError on version mismatch', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'PENDING',
        version: 2,
      });

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetVersionConflictError,
      );
    });
  });
});
