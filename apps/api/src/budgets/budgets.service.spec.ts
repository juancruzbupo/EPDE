import { BudgetStatus, UserRole } from '@epde/shared';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { BudgetAttachmentsRepository } from './budget-attachments.repository';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';
import { BudgetCommentsRepository } from './budget-comments.repository';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetsRepository: {
    findBudgets: jest.Mock;
    findById: jest.Mock;
    findByIdWithDetails: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    respondToBudget: jest.Mock;
  };
  let propertiesRepository: { findOwnership: jest.Mock };
  let notificationsHandler: {
    handleBudgetCreated: jest.Mock;
    handleBudgetQuoted: jest.Mock;
    handleBudgetStatusChanged: jest.Mock;
  };

  const clientUser = { id: 'client-1', role: UserRole.CLIENT };
  const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    budgetsRepository = {
      findBudgets: jest.fn(),
      findById: jest.fn(),
      findByIdWithDetails: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      respondToBudget: jest.fn(),
    };

    propertiesRepository = {
      findOwnership: jest.fn(),
    };

    notificationsHandler = {
      handleBudgetCreated: jest.fn().mockResolvedValue(undefined),
      handleBudgetQuoted: jest.fn().mockResolvedValue(undefined),
      handleBudgetStatusChanged: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: BudgetsRepository, useValue: budgetsRepository },
        { provide: PropertiesRepository, useValue: propertiesRepository },
        { provide: NotificationsHandlerService, useValue: notificationsHandler },
        {
          provide: BudgetAuditLogRepository,
          useValue: { createAuditLog: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: BudgetCommentsRepository,
          useValue: { findByBudgetId: jest.fn(), createComment: jest.fn() },
        },
        { provide: BudgetAttachmentsRepository, useValue: { addAttachments: jest.fn() } },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  describe('listBudgets', () => {
    const filters = { cursor: undefined, take: 10, status: undefined, propertyId: undefined };

    it('should pass userId for CLIENT role', async () => {
      budgetsRepository.findBudgets.mockResolvedValue({ data: [], nextCursor: null });

      await service.listBudgets(filters, clientUser);

      expect(budgetsRepository.findBudgets).toHaveBeenCalledWith({
        cursor: undefined,
        take: 10,
        status: undefined,
        propertyId: undefined,
        userId: 'client-1',
      });
    });

    it('should omit userId for ADMIN role', async () => {
      budgetsRepository.findBudgets.mockResolvedValue({ data: [], nextCursor: null });

      await service.listBudgets(filters, adminUser);

      expect(budgetsRepository.findBudgets).toHaveBeenCalledWith({
        cursor: undefined,
        take: 10,
        status: undefined,
        propertyId: undefined,
        userId: undefined,
      });
    });
  });

  describe('getBudget', () => {
    it('should return budget for admin', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.PENDING,
        property: { userId: 'someone-else' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const result = await service.getBudget('budget-1', adminUser);

      expect(result).toEqual(budget);
      expect(budgetsRepository.findByIdWithDetails).toHaveBeenCalledWith('budget-1');
    });

    it('should throw NotFoundException when budget not found', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.getBudget('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when client accesses another users budget', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.PENDING,
        property: { userId: 'other-user' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      await expect(service.getBudget('budget-1', clientUser)).rejects.toThrow(ForbiddenException);
    });

    it('should return budget when client is the property owner', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.PENDING,
        property: { userId: clientUser.id },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const result = await service.getBudget('budget-1', clientUser);

      expect(result).toEqual(budget);
    });
  });

  describe('createBudgetRequest', () => {
    const dto = {
      propertyId: 'prop-1',
      title: 'Reparacion de techo',
      description: 'Filtracion en el techo',
    };

    it('should create budget and call notification handler', async () => {
      propertiesRepository.findOwnership.mockResolvedValue({
        id: 'prop-1',
        userId: clientUser.id,
      });

      const createdBudget = {
        id: 'budget-new',
        propertyId: 'prop-1',
        requestedBy: clientUser.id,
        title: dto.title,
        description: dto.description,
        status: BudgetStatus.PENDING,
      };
      budgetsRepository.create.mockResolvedValue(createdBudget);

      const result = await service.createBudgetRequest(dto, clientUser.id);

      expect(result).toEqual(createdBudget);
      expect(propertiesRepository.findOwnership).toHaveBeenCalledWith('prop-1');
      expect(budgetsRepository.create).toHaveBeenCalledWith(
        {
          propertyId: 'prop-1',
          requestedBy: clientUser.id,
          createdBy: clientUser.id,
          title: dto.title,
          description: dto.description,
          status: BudgetStatus.PENDING,
        },
        {
          property: { select: { id: true, address: true, city: true } },
          requester: { select: { id: true, name: true } },
          lineItems: true,
          response: true,
          attachments: true,
        },
      );
      expect(notificationsHandler.handleBudgetCreated).toHaveBeenCalledWith({
        budgetId: 'budget-new',
        title: dto.title,
        requesterId: clientUser.id,
        propertyId: 'prop-1',
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      propertiesRepository.findOwnership.mockResolvedValue(null);

      await expect(service.createBudgetRequest(dto, clientUser.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(budgetsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not property owner', async () => {
      propertiesRepository.findOwnership.mockResolvedValue({
        id: 'prop-1',
        userId: 'other-user',
      });

      await expect(service.createBudgetRequest(dto, clientUser.id)).rejects.toThrow(
        ForbiddenException,
      );
      expect(budgetsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('respondToBudget', () => {
    const dto = {
      lineItems: [
        { description: 'Materiales', quantity: 2, unitPrice: 5000 },
        { description: 'Mano de obra', quantity: 1, unitPrice: 30000 },
      ],
      estimatedDays: 5,
      notes: 'Incluye garantia',
      validUntil: '2026-12-31',
    };

    it('should create response with line items and call notification handler', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: BudgetStatus.PENDING,
        version: 0,
      });

      const respondedBudget = {
        id: 'budget-1',
        title: 'Reparacion de techo',
        requestedBy: 'client-1',
        status: BudgetStatus.QUOTED,
      };
      budgetsRepository.respondToBudget.mockResolvedValue(respondedBudget);

      const result = await service.respondToBudget('budget-1', dto);

      expect(result).toEqual(respondedBudget);
      // totalAmount = (2 * 5000) + (1 * 30000) = 40000
      expect(budgetsRepository.respondToBudget).toHaveBeenCalledWith('budget-1', 0, dto.lineItems, {
        totalAmount: expect.anything(),
        estimatedDays: 5,
        notes: 'Incluye garantia',
        validUntil: new Date('2026-12-31'),
        updatedBy: undefined,
      });
      expect(notificationsHandler.handleBudgetQuoted).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        title: 'Reparacion de techo',
        requesterId: 'client-1',
        totalAmount: expect.anything(),
      });
    });

    it('should throw BadRequestException if budget is not PENDING', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: BudgetStatus.QUOTED,
        version: 1,
      });

      budgetsRepository.respondToBudget.mockRejectedValue(
        new BadRequestException('El presupuesto ya no está en estado PENDING'),
      );

      await expect(service.respondToBudget('budget-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if budget not found', async () => {
      budgetsRepository.findById.mockResolvedValue(null);

      await expect(service.respondToBudget('budget-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should pass null validUntil when not provided', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: BudgetStatus.PENDING,
        version: 0,
      });
      budgetsRepository.respondToBudget.mockResolvedValue({
        id: 'budget-1',
        title: 'Test',
        requestedBy: 'client-1',
        status: BudgetStatus.QUOTED,
      });

      const dtoWithoutDate = {
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 1000 }],
      };

      await service.respondToBudget('budget-1', dtoWithoutDate);

      expect(budgetsRepository.respondToBudget).toHaveBeenCalledWith(
        'budget-1',
        0,
        dtoWithoutDate.lineItems,
        expect.objectContaining({ validUntil: null }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should allow QUOTED -> APPROVED by client (property owner)', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.QUOTED,
        requestedBy: 'client-1',
        property: { userId: clientUser.id },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const updatedBudget = { ...budget, status: BudgetStatus.APPROVED };
      budgetsRepository.update.mockResolvedValue(updatedBudget);

      const result = await service.updateStatus(
        'budget-1',
        { status: BudgetStatus.APPROVED },
        clientUser,
      );

      expect(result).toEqual(updatedBudget);
      expect(budgetsRepository.update).toHaveBeenCalledWith(
        'budget-1',
        { status: BudgetStatus.APPROVED, updatedBy: 'client-1' },
        expect.any(Object),
      );
      expect(notificationsHandler.handleBudgetStatusChanged).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        title: 'Test Budget',
        oldStatus: BudgetStatus.QUOTED,
        newStatus: BudgetStatus.APPROVED,
        requesterId: 'client-1',
      });
    });

    it('should allow APPROVED -> IN_PROGRESS by admin', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.APPROVED,
        requestedBy: 'client-1',
        property: { userId: 'client-1' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const updatedBudget = { ...budget, status: BudgetStatus.IN_PROGRESS };
      budgetsRepository.update.mockResolvedValue(updatedBudget);

      const result = await service.updateStatus(
        'budget-1',
        { status: BudgetStatus.IN_PROGRESS },
        adminUser,
      );

      expect(result).toEqual(updatedBudget);
      expect(budgetsRepository.update).toHaveBeenCalledWith(
        'budget-1',
        { status: BudgetStatus.IN_PROGRESS, updatedBy: 'admin-1' },
        expect.any(Object),
      );
      expect(notificationsHandler.handleBudgetStatusChanged).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        title: 'Test Budget',
        oldStatus: BudgetStatus.APPROVED,
        newStatus: BudgetStatus.IN_PROGRESS,
        requesterId: 'client-1',
      });
    });

    it('should throw ForbiddenException when wrong role attempts transition', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.QUOTED,
        requestedBy: 'client-1',
        property: { userId: 'client-1' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      // Admin trying to approve (only CLIENT can do QUOTED -> APPROVED)
      await expect(
        service.updateStatus('budget-1', { status: BudgetStatus.APPROVED }, adminUser),
      ).rejects.toThrow(ForbiddenException);

      expect(budgetsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when budget not found', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: BudgetStatus.APPROVED }, clientUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid current status transition', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.PENDING,
        requestedBy: 'client-1',
        property: { userId: clientUser.id },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      // PENDING has no allowed transitions in the map
      await expect(
        service.updateStatus('budget-1', { status: BudgetStatus.APPROVED }, clientUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when client is not property owner', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: BudgetStatus.QUOTED,
        requestedBy: 'client-1',
        property: { userId: 'other-client' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      await expect(
        service.updateStatus('budget-1', { status: BudgetStatus.APPROVED }, clientUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
