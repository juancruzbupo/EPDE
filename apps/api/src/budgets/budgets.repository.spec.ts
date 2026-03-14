import { BudgetStatus } from '@epde/shared';

import {
  BudgetNotEditableError,
  BudgetNotQuotableError,
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
    budgetLineItem: { createMany: jest.fn(), deleteMany: jest.fn() },
    budgetResponse: { create: jest.fn(), deleteMany: jest.fn() },
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
        status: BudgetStatus.PENDING,
        version: 1,
      });
      mockTx.budgetRequest.update.mockResolvedValue({ id: 'b1', status: BudgetStatus.QUOTED });
      mockTx.budgetLineItem.createMany.mockResolvedValue({ count: 1 });
      mockTx.budgetResponse.create.mockResolvedValue({ id: 'r1' });

      const result = await repository.respondToBudget('b1', 1, lineItems, response);

      expect(result).toEqual({ id: 'b1', status: BudgetStatus.QUOTED });
      expect(mockTx.budgetLineItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ budgetRequestId: 'b1', description: 'Item 1' }),
        ]),
      });
      expect(mockTx.budgetResponse.create).toHaveBeenCalled();
      expect(mockTx.budgetRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'b1' },
          data: expect.objectContaining({ status: BudgetStatus.QUOTED, version: { increment: 1 } }),
        }),
      );
    });

    it('should re-quote when budget is QUOTED (deletes old line items and response)', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.QUOTED,
        version: 2,
      });
      mockTx.budgetLineItem.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.budgetResponse.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.budgetLineItem.createMany.mockResolvedValue({ count: 1 });
      mockTx.budgetResponse.create.mockResolvedValue({ id: 'r2' });
      mockTx.budgetRequest.update.mockResolvedValue({ id: 'b1', status: BudgetStatus.QUOTED });

      const result = await repository.respondToBudget('b1', 2, lineItems, response);

      expect(mockTx.budgetLineItem.deleteMany).toHaveBeenCalledWith({
        where: { budgetRequestId: 'b1' },
      });
      expect(mockTx.budgetResponse.deleteMany).toHaveBeenCalledWith({
        where: { budgetRequestId: 'b1' },
      });
      expect(result).toEqual({ id: 'b1', status: BudgetStatus.QUOTED });
    });

    it('should throw BudgetNotQuotableError when budget is not PENDING or QUOTED', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.APPROVED,
        version: 1,
      });

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetNotQuotableError,
      );
    });

    it('should throw BudgetNotQuotableError when budget not found', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue(null);

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetNotQuotableError,
      );
    });

    it('should throw BudgetVersionConflictError on version mismatch', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.PENDING,
        version: 2,
      });

      await expect(repository.respondToBudget('b1', 1, lineItems, response)).rejects.toThrow(
        BudgetVersionConflictError,
      );
    });
  });

  describe('editBudgetRequest', () => {
    it('should succeed when budget is PENDING and version matches', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.PENDING,
        version: 0,
      });
      mockTx.budgetRequest.update.mockResolvedValue({ id: 'b1', title: 'Updated' });

      const result = await repository.editBudgetRequest('b1', 0, { title: 'Updated' }, 'user-1');

      expect(result).toEqual({ id: 'b1', title: 'Updated' });
      expect(mockTx.budgetRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'b1' },
          data: expect.objectContaining({
            title: 'Updated',
            updatedBy: 'user-1',
            version: { increment: 1 },
          }),
        }),
      );
    });

    it('should throw BudgetNotEditableError when not PENDING', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.QUOTED,
        version: 0,
      });

      await expect(
        repository.editBudgetRequest('b1', 0, { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(BudgetNotEditableError);
    });

    it('should throw BudgetVersionConflictError on version mismatch', async () => {
      mockTx.budgetRequest.findUnique.mockResolvedValue({
        id: 'b1',
        status: BudgetStatus.PENDING,
        version: 5,
      });

      await expect(
        repository.editBudgetRequest('b1', 0, { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(BudgetVersionConflictError);
    });
  });
});
