import { TaskStatus } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { TaskAuditLogRepository } from './task-audit-log.repository';

describe('TaskAuditLogRepository', () => {
  let repository: TaskAuditLogRepository;
  let prisma: PrismaService;

  const mockAuditLogModel = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      taskAuditLog: mockAuditLogModel,
    } as unknown as PrismaService;

    repository = new TaskAuditLogRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createAuditLog', () => {
    it('should create an audit log with JSON before/after values', async () => {
      const before = { status: TaskStatus.PENDING };
      const after = { status: TaskStatus.COMPLETED };
      mockAuditLogModel.create.mockResolvedValue({
        id: 'clx1aud00000001',
        taskId: 'clx1tsk00000001',
        userId: 'clx1usr00000001',
        action: 'STATUS_CHANGE',
        before,
        after,
      });

      await repository.createAuditLog(
        'clx1tsk00000001',
        'clx1usr00000001',
        'STATUS_CHANGE',
        before,
        after,
      );

      expect(mockAuditLogModel.create).toHaveBeenCalledWith({
        data: {
          taskId: 'clx1tsk00000001',
          userId: 'clx1usr00000001',
          action: 'STATUS_CHANGE',
          before: { status: TaskStatus.PENDING },
          after: { status: TaskStatus.COMPLETED },
        },
      });
    });

    it('should pass all fields to prisma create', async () => {
      const before = { priority: 'LOW' };
      const after = { priority: 'HIGH' };
      mockAuditLogModel.create.mockResolvedValue({ id: 'clx1aud00000002' });

      await repository.createAuditLog(
        'clx1tsk00000002',
        'clx1usr00000001',
        'PRIORITY_CHANGE',
        before,
        after,
      );

      const call = mockAuditLogModel.create.mock.calls[0][0];
      expect(call.data.taskId).toBe('clx1tsk00000002');
      expect(call.data.userId).toBe('clx1usr00000001');
      expect(call.data.action).toBe('PRIORITY_CHANGE');
      expect(call.data.before).toEqual({ priority: 'LOW' });
      expect(call.data.after).toEqual({ priority: 'HIGH' });
    });
  });

  describe('findByTaskId', () => {
    it('should order by changedAt desc', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { changedAt: 'desc' },
        }),
      );
    });

    it('should include user with id and name', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
      );
    });

    it('should filter by taskId', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockAuditLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: 'clx1tsk00000001' },
        }),
      );
    });

    it('should return empty array when no logs exist', async () => {
      mockAuditLogModel.findMany.mockResolvedValue([]);

      const result = await repository.findByTaskId('clx1tsk00000001');

      expect(result).toEqual([]);
    });
  });
});
