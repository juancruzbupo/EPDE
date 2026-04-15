import { ReferralsRepository } from './referrals.repository';

describe('ReferralsRepository', () => {
  let repository: ReferralsRepository;
  let prisma: {
    referral: {
      findFirst: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      referral: {
        findFirst: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new ReferralsRepository(prisma as never);
  });

  // ─── findPendingByReferredUser ────────────────────────────────────────────

  describe('findPendingByReferredUser', () => {
    it('returns the pending referral for the referred user', async () => {
      const pending = { id: 'ref-1', referrerId: 'r1', status: 'PENDING' };
      prisma.referral.findFirst.mockResolvedValue(pending);

      const result = await repository.findPendingByReferredUser('user-1');

      expect(result).toBe(pending);
      expect(prisma.referral.findFirst).toHaveBeenCalledWith({
        where: { referredUserId: 'user-1', status: 'PENDING' },
      });
    });

    it('does NOT return a referral that already converted — converted users cannot re-trigger counters', async () => {
      // Simulates the case where the user had a pending referral that was
      // already marked CONVERTED. The WHERE status: 'PENDING' filter in the
      // query ensures findFirst returns null in this case, so the service
      // treats it as a no-op.
      prisma.referral.findFirst.mockResolvedValue(null);

      const result = await repository.findPendingByReferredUser('user-1');

      expect(result).toBeNull();
      // The call shape is the contract — if someone drops the PENDING filter
      // the test below catches it.
      expect(prisma.referral.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('returns null when the user was never referred', async () => {
      prisma.referral.findFirst.mockResolvedValue(null);
      const result = await repository.findPendingByReferredUser('never-referred');
      expect(result).toBeNull();
    });
  });

  // ─── countConvertedForReferrer ────────────────────────────────────────────

  describe('countConvertedForReferrer', () => {
    it('counts only CONVERTED referrals for the given referrer', async () => {
      prisma.referral.count.mockResolvedValue(4);

      const result = await repository.countConvertedForReferrer('referrer-1');

      expect(result).toBe(4);
      expect(prisma.referral.count).toHaveBeenCalledWith({
        where: { referrerId: 'referrer-1', status: 'CONVERTED' },
      });
    });

    it('returns 0 when the referrer has no conversions', async () => {
      prisma.referral.count.mockResolvedValue(0);
      const result = await repository.countConvertedForReferrer('new-referrer');
      expect(result).toBe(0);
    });
  });

  // ─── findHistoryForReferrer ───────────────────────────────────────────────

  describe('findHistoryForReferrer', () => {
    it('returns the history most-recent-first with a 50-item cap', async () => {
      const history = [
        { id: 'ref-2', status: 'CONVERTED', createdAt: new Date('2026-04-01') },
        { id: 'ref-1', status: 'PENDING', createdAt: new Date('2026-03-01') },
      ];
      prisma.referral.findMany.mockResolvedValue(history);

      const result = await repository.findHistoryForReferrer('referrer-1');

      expect(result).toBe(history);
      expect(prisma.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'referrer-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          // The name is rendered in the referrer's history even after the
          // referred user soft-deletes their account — no deletedAt filter
          // on this include by design.
          referredUser: { select: { name: true } },
        },
      });
    });

    it('returns empty array when the referrer has no referrals', async () => {
      prisma.referral.findMany.mockResolvedValue([]);
      const result = await repository.findHistoryForReferrer('new-referrer');
      expect(result).toEqual([]);
    });
  });

  // ─── withTransaction (inherited from BaseRepository) ──────────────────────

  describe('withTransaction', () => {
    it('delegates to prisma.$transaction with the provided callback', async () => {
      const callback = jest.fn(async () => 'result');
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) => cb({} as never));

      const result = await repository.withTransaction(callback);

      expect(result).toBe('result');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('propagates the callback return value verbatim', async () => {
      const payload = { converted: true, referrerId: 'r1' };
      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
        cb({} as never),
      );

      const result = await repository.withTransaction(async () => payload);

      expect(result).toBe(payload);
    });
  });
});
