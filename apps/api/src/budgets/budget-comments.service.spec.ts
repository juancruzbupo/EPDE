import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { BudgetCommentsService } from './budget-comments.service';

const adminUser = { id: 'admin-1', role: 'ADMIN' };
const clientUser = { id: 'client-1', role: 'CLIENT' };

const activeBudget = {
  id: 'budget-1',
  title: 'Techado',
  status: 'PENDING',
  requestedBy: 'client-1',
  property: { userId: 'client-1' },
};

const terminalBudget = { ...activeBudget, status: 'COMPLETED' };

describe('BudgetCommentsService', () => {
  let service: BudgetCommentsService;
  let budgetsRepository: { findByIdWithDetails: jest.Mock };
  let commentsRepository: { findByBudgetId: jest.Mock; createComment: jest.Mock };
  let auditLogRepository: { createAuditLog: jest.Mock };
  let notificationsHandler: { handleBudgetCommentAdded: jest.Mock };

  const dto = { content: 'Puede ser antes del viernes?' };

  beforeEach(() => {
    budgetsRepository = { findByIdWithDetails: jest.fn().mockResolvedValue(activeBudget) };
    commentsRepository = {
      findByBudgetId: jest.fn().mockResolvedValue([]),
      createComment: jest.fn().mockResolvedValue({ id: 'cmt-1', content: dto.content }),
    };
    auditLogRepository = { createAuditLog: jest.fn().mockResolvedValue(undefined) };
    notificationsHandler = { handleBudgetCommentAdded: jest.fn().mockResolvedValue(undefined) };

    service = new BudgetCommentsService(
      budgetsRepository as never,
      commentsRepository as never,
      auditLogRepository as never,
      notificationsHandler as never,
    );
  });

  describe('getComments', () => {
    it('returns comments list for an owned budget', async () => {
      commentsRepository.findByBudgetId.mockResolvedValue([{ id: 'c-1' }]);
      const result = await service.getComments('budget-1', clientUser as never);
      expect(result).toEqual([{ id: 'c-1' }]);
    });

    it('throws NotFoundException when budget does not exist', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.getComments('budget-1', clientUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when CLIENT does not own the budget', async () => {
      const other = { id: 'other', role: 'CLIENT' };
      await expect(service.getComments('budget-1', other as never)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addComment', () => {
    it('creates and returns the comment', async () => {
      const result = await service.addComment('budget-1', dto, clientUser as never);
      expect(result).toEqual({ id: 'cmt-1', content: dto.content });
      expect(commentsRepository.createComment).toHaveBeenCalledWith(
        'budget-1',
        'client-1',
        dto.content,
      );
    });

    it('throws NotFoundException when budget does not exist', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.addComment('budget-1', dto, adminUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for a terminal budget', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(terminalBudget);
      await expect(service.addComment('budget-1', dto, clientUser as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('fires notification as fire-and-forget after comment creation', async () => {
      await service.addComment('budget-1', dto, clientUser as never);
      expect(notificationsHandler.handleBudgetCommentAdded).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        title: 'Techado',
        commentAuthorId: 'client-1',
        requesterId: 'client-1',
      });
    });
  });
});
