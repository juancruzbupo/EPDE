import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { UserRole } from '@epde/shared';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetsRepository: Record<string, jest.Mock>;
  let propertiesRepository: Record<string, jest.Mock>;
  let eventEmitter: Record<string, jest.Mock>;

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

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: BudgetsRepository, useValue: budgetsRepository },
        { provide: PropertiesRepository, useValue: propertiesRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
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
        status: 'PENDING',
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
        status: 'PENDING',
        property: { userId: 'other-user' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      await expect(service.getBudget('budget-1', clientUser)).rejects.toThrow(ForbiddenException);
    });

    it('should return budget when client is the property owner', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: 'PENDING',
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

    it('should create budget and emit event', async () => {
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
        status: 'PENDING',
      };
      budgetsRepository.create.mockResolvedValue(createdBudget);

      const result = await service.createBudgetRequest(dto, clientUser.id);

      expect(result).toEqual(createdBudget);
      expect(propertiesRepository.findOwnership).toHaveBeenCalledWith('prop-1');
      expect(budgetsRepository.create).toHaveBeenCalledWith(
        {
          propertyId: 'prop-1',
          requestedBy: clientUser.id,
          title: dto.title,
          description: dto.description,
          status: 'PENDING',
        },
        {
          property: { select: { id: true, address: true, city: true } },
          requester: { select: { id: true, name: true } },
          lineItems: true,
          response: true,
        },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.created', {
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

    it('should create response with line items and emit event', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: 'PENDING',
      });

      const respondedBudget = {
        id: 'budget-1',
        title: 'Reparacion de techo',
        requestedBy: 'client-1',
        status: 'QUOTED',
      };
      budgetsRepository.respondToBudget.mockResolvedValue(respondedBudget);

      const result = await service.respondToBudget('budget-1', dto);

      expect(result).toEqual(respondedBudget);
      // totalAmount = (2 * 5000) + (1 * 30000) = 40000
      expect(budgetsRepository.respondToBudget).toHaveBeenCalledWith('budget-1', dto.lineItems, {
        totalAmount: 40000,
        estimatedDays: 5,
        notes: 'Incluye garantia',
        validUntil: new Date('2026-12-31'),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.quoted', {
        budgetId: 'budget-1',
        title: 'Reparacion de techo',
        requesterId: 'client-1',
        totalAmount: 40000,
      });
    });

    it('should throw BadRequestException if budget is not PENDING', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: 'QUOTED',
      });

      await expect(service.respondToBudget('budget-1', dto)).rejects.toThrow(BadRequestException);
      expect(budgetsRepository.respondToBudget).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if budget not found', async () => {
      budgetsRepository.findById.mockResolvedValue(null);

      await expect(service.respondToBudget('budget-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should pass null validUntil when not provided', async () => {
      budgetsRepository.findById.mockResolvedValue({
        id: 'budget-1',
        status: 'PENDING',
      });
      budgetsRepository.respondToBudget.mockResolvedValue({
        id: 'budget-1',
        title: 'Test',
        requestedBy: 'client-1',
        status: 'QUOTED',
      });

      const dtoWithoutDate = {
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 1000 }],
      };

      await service.respondToBudget('budget-1', dtoWithoutDate);

      expect(budgetsRepository.respondToBudget).toHaveBeenCalledWith(
        'budget-1',
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
        status: 'QUOTED',
        requestedBy: 'client-1',
        property: { userId: clientUser.id },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const updatedBudget = { ...budget, status: 'APPROVED' };
      budgetsRepository.update.mockResolvedValue(updatedBudget);

      const result = await service.updateStatus('budget-1', { status: 'APPROVED' }, clientUser);

      expect(result).toEqual(updatedBudget);
      expect(budgetsRepository.update).toHaveBeenCalledWith(
        'budget-1',
        { status: 'APPROVED' },
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.statusChanged', {
        budgetId: 'budget-1',
        title: 'Test Budget',
        oldStatus: 'QUOTED',
        newStatus: 'APPROVED',
        requesterId: 'client-1',
      });
    });

    it('should allow APPROVED -> IN_PROGRESS by admin', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: 'APPROVED',
        requestedBy: 'client-1',
        property: { userId: 'client-1' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      const updatedBudget = { ...budget, status: 'IN_PROGRESS' };
      budgetsRepository.update.mockResolvedValue(updatedBudget);

      const result = await service.updateStatus('budget-1', { status: 'IN_PROGRESS' }, adminUser);

      expect(result).toEqual(updatedBudget);
      expect(budgetsRepository.update).toHaveBeenCalledWith(
        'budget-1',
        { status: 'IN_PROGRESS' },
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.statusChanged', {
        budgetId: 'budget-1',
        title: 'Test Budget',
        oldStatus: 'APPROVED',
        newStatus: 'IN_PROGRESS',
        requesterId: 'client-1',
      });
    });

    it('should throw ForbiddenException when wrong role attempts transition', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: 'QUOTED',
        requestedBy: 'client-1',
        property: { userId: 'client-1' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      // Admin trying to approve (only CLIENT can do QUOTED -> APPROVED)
      await expect(
        service.updateStatus('budget-1', { status: 'APPROVED' }, adminUser),
      ).rejects.toThrow(ForbiddenException);

      expect(budgetsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when budget not found', async () => {
      budgetsRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: 'APPROVED' }, clientUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid current status transition', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: 'PENDING',
        requestedBy: 'client-1',
        property: { userId: clientUser.id },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      // PENDING has no allowed transitions in the map
      await expect(
        service.updateStatus('budget-1', { status: 'APPROVED' }, clientUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when client is not property owner', async () => {
      const budget = {
        id: 'budget-1',
        title: 'Test Budget',
        status: 'QUOTED',
        requestedBy: 'client-1',
        property: { userId: 'other-client' },
      };
      budgetsRepository.findByIdWithDetails.mockResolvedValue(budget);

      await expect(
        service.updateStatus('budget-1', { status: 'APPROVED' }, clientUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
