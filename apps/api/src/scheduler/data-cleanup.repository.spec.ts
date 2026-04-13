import { DataCleanupRepository } from './data-cleanup.repository';

describe('DataCleanupRepository', () => {
  let repository: DataCleanupRepository;
  let prisma: {
    taskLog: { deleteMany: jest.Mock };
    taskNote: { deleteMany: jest.Mock };
    taskAuditLog: { deleteMany: jest.Mock };
    task: { deleteMany: jest.Mock };
    budgetRequest: { deleteMany: jest.Mock };
    serviceRequest: { deleteMany: jest.Mock };
    category: { deleteMany: jest.Mock };
    property: { deleteMany: jest.Mock };
    user: { deleteMany: jest.Mock };
    iSVSnapshot: { deleteMany: jest.Mock };
  };

  const cutoff = new Date('2025-01-01T00:00:00.000Z');

  beforeEach(() => {
    // Each deleteMany resolves with a unique count so we can verify result mapping
    prisma = {
      taskLog: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      taskNote: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
      taskAuditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
      task: { deleteMany: jest.fn().mockResolvedValue({ count: 4 }) },
      budgetRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
      serviceRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 6 }) },
      category: { deleteMany: jest.fn().mockResolvedValue({ count: 7 }) },
      property: { deleteMany: jest.fn().mockResolvedValue({ count: 8 }) },
      user: { deleteMany: jest.fn().mockResolvedValue({ count: 9 }) },
      iSVSnapshot: { deleteMany: jest.fn().mockResolvedValue({ count: 10 }) },
    };
    repository = new DataCleanupRepository(prisma as never);
  });

  describe('hardDeleteSoftDeletedBefore', () => {
    it('returns aggregated counts from all nine delete operations', async () => {
      const result = await repository.hardDeleteSoftDeletedBefore(cutoff);

      expect(result).toEqual({
        taskLogs: 1,
        taskNotes: 2,
        taskAuditLogs: 3,
        tasks: 4,
        budgets: 5,
        serviceRequests: 6,
        categories: 7,
        properties: 8,
        users: 9,
      });
    });

    it('passes cutoff date in where clause for dependent models (taskLog)', async () => {
      await repository.hardDeleteSoftDeletedBefore(cutoff);
      expect(prisma.taskLog.deleteMany).toHaveBeenCalledWith({
        where: { task: { deletedAt: { not: null, lt: cutoff } } },
      });
    });

    it('passes cutoff date in where clause for leaf models (user)', async () => {
      await repository.hardDeleteSoftDeletedBefore(cutoff);
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
    });

    it('deletes task dependents (taskLog, taskNote, taskAuditLog) BEFORE tasks — preserves FK integrity', async () => {
      const callOrder: string[] = [];
      prisma.taskLog.deleteMany.mockImplementation(() => {
        callOrder.push('taskLog');
        return Promise.resolve({ count: 0 });
      });
      prisma.taskNote.deleteMany.mockImplementation(() => {
        callOrder.push('taskNote');
        return Promise.resolve({ count: 0 });
      });
      prisma.taskAuditLog.deleteMany.mockImplementation(() => {
        callOrder.push('taskAuditLog');
        return Promise.resolve({ count: 0 });
      });
      prisma.task.deleteMany.mockImplementation(() => {
        callOrder.push('task');
        return Promise.resolve({ count: 0 });
      });
      prisma.budgetRequest.deleteMany.mockImplementation(() => {
        callOrder.push('budgetRequest');
        return Promise.resolve({ count: 0 });
      });
      prisma.serviceRequest.deleteMany.mockImplementation(() => {
        callOrder.push('serviceRequest');
        return Promise.resolve({ count: 0 });
      });
      prisma.category.deleteMany.mockImplementation(() => {
        callOrder.push('category');
        return Promise.resolve({ count: 0 });
      });
      prisma.property.deleteMany.mockImplementation(() => {
        callOrder.push('property');
        return Promise.resolve({ count: 0 });
      });
      prisma.user.deleteMany.mockImplementation(() => {
        callOrder.push('user');
        return Promise.resolve({ count: 0 });
      });

      await repository.hardDeleteSoftDeletedBefore(cutoff);

      // Task dependents must come before task
      expect(callOrder.indexOf('taskLog')).toBeLessThan(callOrder.indexOf('task'));
      expect(callOrder.indexOf('taskNote')).toBeLessThan(callOrder.indexOf('task'));
      expect(callOrder.indexOf('taskAuditLog')).toBeLessThan(callOrder.indexOf('task'));
      // Properties must come before users (property.userId FK)
      expect(callOrder.indexOf('property')).toBeLessThan(callOrder.indexOf('user'));
    });

    it('handles empty tables gracefully (all counts are 0)', async () => {
      Object.values(prisma).forEach((model) => {
        if ('deleteMany' in model) {
          (model as { deleteMany: jest.Mock }).deleteMany.mockResolvedValue({ count: 0 });
        }
      });

      const result = await repository.hardDeleteSoftDeletedBefore(cutoff);
      expect(Object.values(result).every((v) => v === 0)).toBe(true);
    });
  });

  describe('deleteOldSnapshots', () => {
    it('deletes ISV snapshots older than the given date', async () => {
      const before = new Date('2024-01-01T00:00:00.000Z');
      const count = await repository.deleteOldSnapshots(before);

      expect(prisma.iSVSnapshot.deleteMany).toHaveBeenCalledWith({
        where: { snapshotDate: { lt: before } },
      });
      expect(count).toBe(10);
    });

    it('returns 0 when no snapshots are older than the cutoff', async () => {
      prisma.iSVSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      const count = await repository.deleteOldSnapshots(new Date());
      expect(count).toBe(0);
    });
  });
});
