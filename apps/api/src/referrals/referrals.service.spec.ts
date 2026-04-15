import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { UsersRepository } from '../users/users.repository';
import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';

/** Minimal `tx` shape the service touches inside withTransaction callbacks. */
type MockTx = {
  referral: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  user: { findUnique: jest.Mock; update: jest.Mock };
};

describe('ReferralsService', () => {
  let service: ReferralsService;
  let repo: {
    findPendingByReferredUser: jest.Mock;
    countConvertedForReferrer: jest.Mock;
    findHistoryForReferrer: jest.Mock;
    findById: jest.Mock;
    withTransaction: jest.Mock;
  };
  let usersRepo: {
    setReferralCode: jest.Mock;
    findByReferralCode: jest.Mock;
    findForReferralNotification: jest.Mock;
    findReferralCounter: jest.Mock;
    applyReferralCounters: jest.Mock;
    findReferralState: jest.Mock;
  };
  let notificationsHandler: {
    handleReferralMilestoneReached: jest.Mock;
    handleReferralMaxReached: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findPendingByReferredUser: jest.fn(),
      countConvertedForReferrer: jest.fn(),
      findHistoryForReferrer: jest.fn(),
      findById: jest.fn(),
      withTransaction: jest.fn(),
    };

    usersRepo = {
      setReferralCode: jest.fn(),
      findByReferralCode: jest.fn(),
      findForReferralNotification: jest.fn(),
      findReferralCounter: jest.fn(),
      applyReferralCounters: jest.fn(),
      findReferralState: jest.fn(),
    };

    notificationsHandler = {
      handleReferralMilestoneReached: jest.fn().mockResolvedValue(undefined),
      handleReferralMaxReached: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: ReferralsRepository, useValue: repo },
        { provide: UsersRepository, useValue: usersRepo },
        { provide: NotificationsHandlerService, useValue: notificationsHandler },
      ],
    }).compile();

    service = module.get(ReferralsService);
  });

  // ─── assignReferralCodeTo ──────────────────────────────────────────────

  describe('assignReferralCodeTo', () => {
    it('sets a unique code on first attempt', async () => {
      usersRepo.setReferralCode.mockResolvedValue(undefined);
      const code = await service.assignReferralCodeTo('u1', 'Maria');
      expect(code).toMatch(/^MARIA-[A-HJ-NP-Z2-9]{3}$/);
      expect(usersRepo.setReferralCode).toHaveBeenCalledWith('u1', code);
    });

    it('retries on unique-constraint collision', async () => {
      usersRepo.setReferralCode
        .mockRejectedValueOnce(new Error('Unique constraint failed'))
        .mockResolvedValueOnce(undefined);
      const code = await service.assignReferralCodeTo('u1', 'Maria');
      expect(code).toMatch(/^MARIA-/);
      expect(usersRepo.setReferralCode).toHaveBeenCalledTimes(2);
    });

    it('throws after 5 collisions', async () => {
      usersRepo.setReferralCode.mockRejectedValue(new Error('Unique constraint failed'));
      await expect(service.assignReferralCodeTo('u1', 'Maria')).rejects.toThrow(
        /Failed to generate/,
      );
      expect(usersRepo.setReferralCode).toHaveBeenCalledTimes(5);
    });

    it('rethrows non-collision errors immediately', async () => {
      usersRepo.setReferralCode.mockRejectedValue(new Error('DB down'));
      await expect(service.assignReferralCodeTo('u1', 'Maria')).rejects.toThrow('DB down');
      expect(usersRepo.setReferralCode).toHaveBeenCalledTimes(1);
    });
  });

  // ─── registerReferral ──────────────────────────────────────────────────

  describe('registerReferral', () => {
    it('creates a PENDING referral for a valid code', async () => {
      usersRepo.findByReferralCode.mockResolvedValue({ id: 'referrer-1', deletedAt: null });
      const tx = makeTxForRegister();
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      await service.registerReferral('newbie', 'newbie@epde.com', 'MARIA-K3P');

      expect(usersRepo.findByReferralCode).toHaveBeenCalledWith('MARIA-K3P');
      expect(repo.withTransaction).toHaveBeenCalledTimes(1);
      expect(tx.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-1',
          referredUserId: 'newbie',
          referredEmail: 'newbie@epde.com',
          status: 'PENDING',
        },
      });
    });

    it('normalizes the code to uppercase before lookup', async () => {
      usersRepo.findByReferralCode.mockResolvedValue(null);
      await service.registerReferral('newbie', 'newbie@epde.com', '  maria-k3p  ');
      expect(usersRepo.findByReferralCode).toHaveBeenCalledWith('MARIA-K3P');
    });

    it('is a no-op when code is unknown (does NOT throw)', async () => {
      usersRepo.findByReferralCode.mockResolvedValue(null);
      await expect(
        service.registerReferral('newbie', 'newbie@epde.com', 'BOGUS-XYZ'),
      ).resolves.toBeUndefined();
      expect(repo.withTransaction).not.toHaveBeenCalled();
    });

    it('is a no-op when referrer is soft-deleted', async () => {
      usersRepo.findByReferralCode.mockResolvedValue({
        id: 'referrer-1',
        deletedAt: new Date(),
      });
      await service.registerReferral('newbie', 'newbie@epde.com', 'MARIA-K3P');
      expect(repo.withTransaction).not.toHaveBeenCalled();
    });

    it('rejects self-referral', async () => {
      usersRepo.findByReferralCode.mockResolvedValue({ id: 'newbie', deletedAt: null });
      await service.registerReferral('newbie', 'newbie@epde.com', 'MARIA-K3P');
      expect(repo.withTransaction).not.toHaveBeenCalled();
    });
  });

  // ─── convertReferral ───────────────────────────────────────────────────

  describe('convertReferral', () => {
    it('returns converted: false when the user was not referred', async () => {
      repo.findPendingByReferredUser.mockResolvedValue(null);
      const result = await service.convertReferral('u1');
      expect(result).toEqual({ converted: false });
      expect(repo.withTransaction).not.toHaveBeenCalled();
    });

    it('applies milestone 1 on the first conversion (1 month credit)', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 0,
          referralCreditMonths: 0,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toEqual({
        converted: true,
        referrerId: 'referrer-1',
        milestone: 1,
        delta: { months: 1, annualDiagnosis: 0, biannualDiagnosis: 0 },
      });
      expect(tx.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: expect.objectContaining({ status: 'CONVERTED' }),
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: expect.objectContaining({
          convertedCount: 1,
          referralCreditMonths: 1,
        }),
      });
    });

    it('jumps to milestone 3 with annual diagnosis on the 3rd conversion', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-3',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 2,
          referralCreditMonths: 2,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toEqual({
        converted: true,
        referrerId: 'referrer-1',
        milestone: 3,
        delta: { months: 1, annualDiagnosis: 1, biannualDiagnosis: 0 },
      });
    });

    it('does NOT re-apply reward on intermediate conversions (3 → 4)', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-4',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 3,
          referralCreditMonths: 3,
          referralCreditAnnualDiagnosis: 1,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toMatchObject({
        converted: true,
        delta: { months: 0, annualDiagnosis: 0, biannualDiagnosis: 0 },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: expect.objectContaining({
          convertedCount: 4,
          referralCreditMonths: 3,
        }),
      });
    });

    it('caps at milestone 10 on the 10th conversion', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-10',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 9,
          referralCreditMonths: 6,
          referralCreditAnnualDiagnosis: 1,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toMatchObject({
        converted: true,
        milestone: 10,
        delta: { months: 6, annualDiagnosis: 0, biannualDiagnosis: 1 },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: expect.objectContaining({
          convertedCount: 10,
          referralCreditMonths: 12,
          referralCreditBiannualDiagnosis: 1,
        }),
      });
    });

    it('does NOT bump rewards past milestone 10 (11th conversion)', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-11',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 10,
          referralCreditMonths: 12,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 1,
          subscriptionExpiresAt: new Date('2027-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toMatchObject({
        converted: true,
        delta: { months: 0, annualDiagnosis: 0, biannualDiagnosis: 0 },
      });
    });

    it('extends subscriptionExpiresAt by delta months only, not the total', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      const initial = new Date('2026-06-01T12:00:00Z');
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 0,
          referralCreditMonths: 0,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: initial,
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      await service.convertReferral('u1');

      const updatedExpiry = tx.user.update.mock.calls[0][0].data.subscriptionExpiresAt as Date;
      expect(updatedExpiry.getMonth()).toBe(6); // June (5) + 1 = July (6)
      expect(updatedExpiry.getFullYear()).toBe(2026);
    });

    it('uses now() as baseline when subscriptionExpiresAt is null', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 0,
          referralCreditMonths: 0,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: null,
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const before = Date.now();
      await service.convertReferral('u1');

      const updatedExpiry = tx.user.update.mock.calls[0][0].data.subscriptionExpiresAt as Date;
      expect(updatedExpiry.getTime()).toBeGreaterThan(before);
    });

    it('is idempotent — a concurrent second call becomes a no-op', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      const tx: MockTx = {
        referral: {
          create: jest.fn(),
          findUnique: jest.fn().mockResolvedValue({ status: 'CONVERTED' }),
          update: jest.fn(),
        },
        user: { findUnique: jest.fn(), update: jest.fn() },
      };
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toEqual({ converted: false });
      expect(tx.referral.update).not.toHaveBeenCalled();
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    it('leaves the referral CONVERTED but skips rewards if the referrer is soft-deleted', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'deleted-referrer',
      });
      const tx: MockTx = {
        referral: {
          create: jest.fn(),
          findUnique: jest.fn().mockResolvedValue({ status: 'PENDING' }),
          update: jest.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(null), // soft-deleted
          update: jest.fn(),
        },
      };
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.convertReferral('u1');

      expect(result).toEqual({ converted: false });
      expect(tx.referral.update).toHaveBeenCalled();
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    // ─── Post-transaction notifications ──────────────────────────────────

    it('fires handleReferralMilestoneReached with the right payload after a milestone jump', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 2,
          referralCreditMonths: 2,
          referralCreditAnnualDiagnosis: 0,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));
      usersRepo.findForReferralNotification.mockResolvedValue({
        email: 'referrer@epde.com',
        name: 'Maria Pérez',
      });

      await service.convertReferral('u1');

      expect(notificationsHandler.handleReferralMilestoneReached).toHaveBeenCalledWith({
        userId: 'referrer-1',
        userEmail: 'referrer@epde.com',
        userName: 'Maria Pérez',
        milestone: 3,
        creditMonths: 3,
        nextMilestone: 5,
        hasAnnualDiagnosis: true,
        hasBiannualDiagnosis: false,
      });
      expect(notificationsHandler.handleReferralMaxReached).not.toHaveBeenCalled();
    });

    it('does NOT fire any handler when the conversion does not cross a milestone (3 → 4)', async () => {
      repo.findPendingByReferredUser.mockResolvedValue({
        id: 'ref-4',
        referrerId: 'referrer-1',
      });
      const tx = mockTransactionCtx({
        referralStatus: 'PENDING',
        referrer: {
          convertedCount: 3,
          referralCreditMonths: 3,
          referralCreditAnnualDiagnosis: 1,
          referralCreditBiannualDiagnosis: 0,
          subscriptionExpiresAt: new Date('2026-06-01'),
        },
      });
      repo.withTransaction.mockImplementation(async (cb) => cb(tx));
      usersRepo.findForReferralNotification.mockResolvedValue({
        email: 'referrer@epde.com',
        name: 'Maria',
      });

      await service.convertReferral('u1');

      expect(notificationsHandler.handleReferralMilestoneReached).not.toHaveBeenCalled();
      expect(notificationsHandler.handleReferralMaxReached).not.toHaveBeenCalled();
    });

    it('fires handleReferralMaxReached on the 10th conversion when ADMIN_NOTIFICATION_EMAIL is set', async () => {
      const previousEnv = process.env.ADMIN_NOTIFICATION_EMAIL;
      process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@epde.com';

      try {
        repo.findPendingByReferredUser.mockResolvedValue({
          id: 'ref-10',
          referrerId: 'referrer-1',
        });
        const tx = mockTransactionCtx({
          referralStatus: 'PENDING',
          referrer: {
            convertedCount: 9,
            referralCreditMonths: 6,
            referralCreditAnnualDiagnosis: 1,
            referralCreditBiannualDiagnosis: 0,
            subscriptionExpiresAt: new Date('2026-06-01'),
          },
        });
        repo.withTransaction.mockImplementation(async (cb) => cb(tx));
        usersRepo.findForReferralNotification.mockResolvedValue({
          email: 'power-referrer@epde.com',
          name: 'Juan Carlos',
        });

        await service.convertReferral('u1');

        expect(notificationsHandler.handleReferralMilestoneReached).toHaveBeenCalledWith(
          expect.objectContaining({ milestone: 10, hasBiannualDiagnosis: true }),
        );
        expect(notificationsHandler.handleReferralMaxReached).toHaveBeenCalledWith({
          adminEmail: 'admin@epde.com',
          clientId: 'referrer-1',
          clientName: 'Juan Carlos',
          clientEmail: 'power-referrer@epde.com',
        });
      } finally {
        process.env.ADMIN_NOTIFICATION_EMAIL = previousEnv;
      }
    });

    it('skips the admin alert (with warn log) when ADMIN_NOTIFICATION_EMAIL is not set', async () => {
      const previousEnv = process.env.ADMIN_NOTIFICATION_EMAIL;
      delete process.env.ADMIN_NOTIFICATION_EMAIL;

      try {
        repo.findPendingByReferredUser.mockResolvedValue({
          id: 'ref-10',
          referrerId: 'referrer-1',
        });
        const tx = mockTransactionCtx({
          referralStatus: 'PENDING',
          referrer: {
            convertedCount: 9,
            referralCreditMonths: 6,
            referralCreditAnnualDiagnosis: 1,
            referralCreditBiannualDiagnosis: 0,
            subscriptionExpiresAt: new Date('2026-06-01'),
          },
        });
        repo.withTransaction.mockImplementation(async (cb) => cb(tx));
        usersRepo.findForReferralNotification.mockResolvedValue({
          email: 'power-referrer@epde.com',
          name: 'Juan',
        });

        await service.convertReferral('u1');

        expect(notificationsHandler.handleReferralMaxReached).not.toHaveBeenCalled();
      } finally {
        if (previousEnv !== undefined) process.env.ADMIN_NOTIFICATION_EMAIL = previousEnv;
      }
    });
  });

  // ─── recomputeReferrerState ────────────────────────────────────────────

  describe('recomputeReferrerState', () => {
    it('no-op when counter already matches the Referral table', async () => {
      usersRepo.findReferralCounter.mockResolvedValue({ convertedCount: 3 });
      repo.countConvertedForReferrer.mockResolvedValue(3);

      const result = await service.recomputeReferrerState('referrer-1');

      expect(result).toEqual({ previousConvertedCount: 3, newConvertedCount: 3 });
      expect(usersRepo.applyReferralCounters).not.toHaveBeenCalled();
    });

    it('overwrites desync with the true count from the Referral table', async () => {
      usersRepo.findReferralCounter.mockResolvedValue({ convertedCount: 2 });
      repo.countConvertedForReferrer.mockResolvedValue(5);
      usersRepo.applyReferralCounters.mockResolvedValue(undefined);

      const result = await service.recomputeReferrerState('referrer-1');

      expect(result).toEqual({ previousConvertedCount: 2, newConvertedCount: 5 });
      expect(usersRepo.applyReferralCounters).toHaveBeenCalledWith(
        'referrer-1',
        expect.objectContaining({
          convertedCount: 5,
          referralCreditMonths: 6, // milestone 5
          referralCreditAnnualDiagnosis: 1,
        }),
      );
    });

    it('throws NotFoundException when user is missing or soft-deleted', async () => {
      usersRepo.findReferralCounter.mockResolvedValue(null);
      await expect(service.recomputeReferrerState('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getReferralStateForUser ───────────────────────────────────────────

  describe('getReferralStateForUser', () => {
    it('builds the full state payload', async () => {
      usersRepo.findReferralState.mockResolvedValue({
        referralCode: 'MARIA-K3P',
        referralCount: 4,
        convertedCount: 2,
        referralCreditMonths: 2,
        referralCreditAnnualDiagnosis: 0,
        referralCreditBiannualDiagnosis: 0,
      });
      repo.findHistoryForReferrer.mockResolvedValue([
        {
          id: 'ref-1',
          status: 'CONVERTED',
          createdAt: new Date('2026-03-01'),
          convertedAt: new Date('2026-03-15'),
          referredUser: { name: 'Juan Pérez' },
        },
        {
          id: 'ref-2',
          status: 'PENDING',
          createdAt: new Date('2026-04-01'),
          convertedAt: null,
          referredUser: null,
        },
      ]);

      const state = await service.getReferralStateForUser('u1');

      expect(state.referralCode).toBe('MARIA-K3P');
      expect(state.referralUrl).toContain('MARIA-K3P');
      expect(state.stats).toEqual({
        totalReferrals: 4,
        convertedCount: 2,
        currentMilestone: 2,
        nextMilestone: 3,
        creditsEarned: { months: 2, annualDiagnosis: 0, biannualDiagnosis: 0 },
      });
      expect(state.milestones).toHaveLength(5);
      expect(state.milestones[0]).toEqual(expect.objectContaining({ target: 1, reached: true }));
      expect(state.milestones[2]).toEqual(expect.objectContaining({ target: 3, reached: false }));
      expect(state.referralHistory).toHaveLength(2);
      expect(state.referralHistory[0]).toEqual(
        expect.objectContaining({ status: 'CONVERTED', referredName: 'Juan Pérez' }),
      );
      // Privacy: pending referrals do not expose the name.
      expect(state.referralHistory[1]).toEqual(
        expect.objectContaining({ status: 'PENDING', referredName: null }),
      );
    });

    it('throws NotFoundException when user is missing or has no referralCode', async () => {
      usersRepo.findReferralState.mockResolvedValue(null);
      await expect(service.getReferralStateForUser('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

/** Minimal stand-in for the register flow's tx. */
function makeTxForRegister(): MockTx {
  return {
    referral: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

/**
 * Helper that builds a `tx` stand-in with the canonical transaction-body
 * reads/writes a healthy convertReferral path performs: re-check the
 * referral is still PENDING, load the referrer, update both.
 */
function mockTransactionCtx(options: {
  referralStatus: 'PENDING' | 'CONVERTED';
  referrer: {
    convertedCount: number;
    referralCreditMonths: number;
    referralCreditAnnualDiagnosis: number;
    referralCreditBiannualDiagnosis: number;
    subscriptionExpiresAt: Date | null;
  } | null;
}): MockTx {
  return {
    referral: {
      create: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ status: options.referralStatus }),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(options.referrer),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}
