import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { BudgetStatus, UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { BudgetAttachmentsService } from './budget-attachments.service';
import { BudgetCommentsService } from './budget-comments.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

const mockBudgetsService = {
  listBudgets: jest.fn(),
  getBudget: jest.fn(),
  createBudgetRequest: jest.fn(),
  respondToBudget: jest.fn(),
  updateStatus: jest.fn(),
};

const adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  subscriptionExpiresAt: null,
  jti: 'jti-admin-1',
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  subscriptionExpiresAt: null,
  jti: 'jti-client-1',
};

const budgetId = 'budget-uuid-1';

describe('BudgetsController', () => {
  let controller: BudgetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        { provide: BudgetsService, useValue: mockBudgetsService },
        {
          provide: BudgetCommentsService,
          useValue: { getComments: jest.fn(), addComment: jest.fn() },
        },
        { provide: BudgetAttachmentsService, useValue: { addAttachments: jest.fn() } },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    jest.clearAllMocks();
  });

  describe('listBudgets', () => {
    it('should delegate to budgetsService.listBudgets and return service result directly', async () => {
      const filters = { cursor: undefined, take: 10, status: undefined, propertyId: undefined };
      const paginatedResult = { data: [], nextCursor: null };
      mockBudgetsService.listBudgets.mockResolvedValue(paginatedResult);

      const result = await controller.listBudgets(filters as any, clientUser);

      expect(mockBudgetsService.listBudgets).toHaveBeenCalledWith(filters, clientUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass admin user to service so service can decide to omit userId filter', async () => {
      const filters = {
        cursor: undefined,
        take: 20,
        status: BudgetStatus.PENDING,
        propertyId: undefined,
      };
      mockBudgetsService.listBudgets.mockResolvedValue({ data: [], nextCursor: null });

      await controller.listBudgets(filters as any, adminUser);

      expect(mockBudgetsService.listBudgets).toHaveBeenCalledWith(filters, adminUser);
    });
  });

  describe('getBudget', () => {
    it('should call budgetsService.getBudget with id and user and return wrapped data', async () => {
      const budget = { id: budgetId, title: 'Reparacion de techo', status: BudgetStatus.PENDING };
      mockBudgetsService.getBudget.mockResolvedValue(budget);

      const result = await controller.getBudget(budgetId, clientUser);

      expect(mockBudgetsService.getBudget).toHaveBeenCalledWith(budgetId, clientUser);
      expect(result).toEqual({ data: budget });
    });

    it('should work for admin user too', async () => {
      const budget = { id: budgetId, title: 'Reparacion de techo', status: BudgetStatus.QUOTED };
      mockBudgetsService.getBudget.mockResolvedValue(budget);

      const result = await controller.getBudget(budgetId, adminUser);

      expect(mockBudgetsService.getBudget).toHaveBeenCalledWith(budgetId, adminUser);
      expect(result).toEqual({ data: budget });
    });
  });

  describe('createBudgetRequest', () => {
    it('should call budgetsService.createBudgetRequest with dto and user id and return wrapped data with message', async () => {
      const dto = {
        propertyId: 'prop-1',
        title: 'Reparacion de techo',
        description: 'Filtracion detectada',
      };
      const createdBudget = { id: budgetId, ...dto, status: BudgetStatus.PENDING };
      mockBudgetsService.createBudgetRequest.mockResolvedValue(createdBudget);

      const result = await controller.createBudgetRequest(dto as any, clientUser);

      expect(mockBudgetsService.createBudgetRequest).toHaveBeenCalledWith(dto, clientUser.id);
      expect(result).toEqual({ data: createdBudget, message: 'Presupuesto solicitado' });
    });

    it('should extract user.id (not the whole user object) to pass to service', async () => {
      const dto = { propertyId: 'prop-1', title: 'Pintura exterior' };
      mockBudgetsService.createBudgetRequest.mockResolvedValue({ id: budgetId });

      await controller.createBudgetRequest(dto as any, clientUser);

      const [, passedUserId] = mockBudgetsService.createBudgetRequest.mock.calls[0];
      expect(passedUserId).toBe('client-1');
    });
  });

  describe('respondToBudget', () => {
    it('should call budgetsService.respondToBudget with id, dto and admin userId and return wrapped data with message', async () => {
      const dto = {
        lineItems: [{ description: 'Materiales', quantity: 1, unitPrice: 5000 }],
        estimatedDays: 3,
      };
      const respondedBudget = { id: budgetId, status: BudgetStatus.QUOTED };
      mockBudgetsService.respondToBudget.mockResolvedValue(respondedBudget);

      const result = await controller.respondToBudget(budgetId, dto as any, adminUser);

      expect(mockBudgetsService.respondToBudget).toHaveBeenCalledWith(budgetId, dto, adminUser);
      expect(result).toEqual({ data: respondedBudget, message: 'Presupuesto cotizado' });
    });

    it('should pass the full admin user to the service', async () => {
      const dto = { lineItems: [{ description: 'Item', quantity: 1, unitPrice: 1000 }] };
      mockBudgetsService.respondToBudget.mockResolvedValue({ id: budgetId });

      await controller.respondToBudget(budgetId, dto as any, adminUser);

      const [, , passedUser] = mockBudgetsService.respondToBudget.mock.calls[0];
      expect(passedUser).toEqual(adminUser);
    });
  });

  describe('updateStatus', () => {
    it('should call budgetsService.updateStatus with id, dto and full user object and return wrapped data with message', async () => {
      const dto = { status: BudgetStatus.APPROVED };
      const updatedBudget = { id: budgetId, status: BudgetStatus.APPROVED };
      mockBudgetsService.updateStatus.mockResolvedValue(updatedBudget);

      const result = await controller.updateStatus(budgetId, dto as any, clientUser);

      expect(mockBudgetsService.updateStatus).toHaveBeenCalledWith(budgetId, dto, clientUser);
      expect(result).toEqual({
        data: updatedBudget,
        message: 'Estado del presupuesto actualizado',
      });
    });

    it('should pass the full user (not just id) so service can perform role-based transition checks', async () => {
      const dto = { status: BudgetStatus.IN_PROGRESS };
      mockBudgetsService.updateStatus.mockResolvedValue({ id: budgetId });

      await controller.updateStatus(budgetId, dto as any, adminUser);

      const [, , passedUser] = mockBudgetsService.updateStatus.mock.calls[0];
      expect(passedUser).toEqual(adminUser);
    });

    it('should propagate service result unchanged inside the data envelope', async () => {
      const dto = { status: BudgetStatus.COMPLETED };
      const serviceResult = {
        id: budgetId,
        title: 'Reparacion',
        status: BudgetStatus.COMPLETED,
        property: { address: 'Av. Corrientes 1234' },
      };
      mockBudgetsService.updateStatus.mockResolvedValue(serviceResult);

      const result = await controller.updateStatus(budgetId, dto as any, clientUser);

      expect(result.data).toEqual(serviceResult);
    });
  });
});
