import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { BudgetAttachmentsService } from './budget-attachments.service';

const adminUser = { id: 'admin-1', role: 'ADMIN' };
const clientUser = { id: 'client-1', role: 'CLIENT' };

const activeBudget = {
  id: 'budget-1',
  status: 'PENDING',
  requestedBy: 'client-1',
  property: { userId: 'client-1' },
};

const terminalBudget = { ...activeBudget, status: 'COMPLETED' };

describe('BudgetAttachmentsService', () => {
  let service: BudgetAttachmentsService;
  let budgetsRepository: { findByIdWithDetails: jest.Mock };
  let attachmentsRepository: { addAttachments: jest.Mock };
  let auditLogRepository: { createAuditLog: jest.Mock };

  const dto = { attachments: [{ url: 'https://s3.test/img.jpg', fileName: 'img.jpg' }] };

  beforeEach(() => {
    budgetsRepository = { findByIdWithDetails: jest.fn().mockResolvedValue(activeBudget) };
    attachmentsRepository = { addAttachments: jest.fn().mockResolvedValue([{ id: 'att-1' }]) };
    auditLogRepository = { createAuditLog: jest.fn().mockResolvedValue(undefined) };

    service = new BudgetAttachmentsService(
      budgetsRepository as never,
      attachmentsRepository as never,
      auditLogRepository as never,
    );
  });

  describe('addAttachments', () => {
    it('returns attachments for an active budget', async () => {
      const result = await service.addAttachments('budget-1', dto, adminUser as never);
      expect(result).toEqual([{ id: 'att-1' }]);
      expect(attachmentsRepository.addAttachments).toHaveBeenCalledWith(
        'budget-1',
        dto.attachments,
      );
    });

    it('throws NotFoundException when budget does not exist', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.addAttachments('budget-1', dto, adminUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for a terminal budget (COMPLETED)', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(terminalBudget);
      await expect(service.addAttachments('budget-1', dto, clientUser as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when CLIENT does not own the budget', async () => {
      const otherClientUser = { id: 'other-client', role: 'CLIENT' };
      await expect(
        service.addAttachments('budget-1', dto, otherClientUser as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows ADMIN to add attachments regardless of ownership', async () => {
      const result = await service.addAttachments('budget-1', dto, adminUser as never);
      expect(result).toBeDefined();
    });

    it('fires audit log as fire-and-forget (does not await)', async () => {
      await service.addAttachments('budget-1', dto, adminUser as never);
      // createAuditLog is called (fire-and-forget via void)
      expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith(
        'budget-1',
        'admin-1',
        'attachments_added',
        {},
        { count: 1 },
      );
    });
  });
});
