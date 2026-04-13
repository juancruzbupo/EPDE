import { BudgetCommentsRepository } from './budget-comments.repository';

describe('BudgetCommentsRepository', () => {
  let repository: BudgetCommentsRepository;
  let prisma: {
    budgetComment: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const comment = {
    id: 'cmt-1',
    budgetId: 'budget-1',
    userId: 'user-1',
    content: 'Puede ser antes del viernes?',
    createdAt: new Date(),
    user: { id: 'user-1', name: 'Ana' },
  };

  beforeEach(() => {
    prisma = {
      budgetComment: {
        create: jest.fn().mockResolvedValue(comment),
        findMany: jest.fn().mockResolvedValue([comment]),
      },
    };
    repository = new BudgetCommentsRepository(prisma as never);
  });

  describe('createComment', () => {
    it('creates a comment and includes user details', async () => {
      const result = await repository.createComment(
        'budget-1',
        'user-1',
        'Puede ser antes del viernes?',
      );
      expect(result).toEqual(comment);
      expect(prisma.budgetComment.create).toHaveBeenCalledWith({
        data: { budgetId: 'budget-1', userId: 'user-1', content: 'Puede ser antes del viernes?' },
        include: { user: { select: { id: true, name: true } } },
      });
    });
  });

  describe('findByBudgetId', () => {
    it('returns comments ordered by createdAt ascending (oldest first)', async () => {
      const result = await repository.findByBudgetId('budget-1');
      expect(result).toEqual([comment]);
      expect(prisma.budgetComment.findMany).toHaveBeenCalledWith({
        where: { budgetId: 'budget-1' },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true } } },
      });
    });

    it('returns empty array when budget has no comments', async () => {
      prisma.budgetComment.findMany.mockResolvedValue([]);
      const result = await repository.findByBudgetId('budget-1');
      expect(result).toEqual([]);
    });
  });
});
