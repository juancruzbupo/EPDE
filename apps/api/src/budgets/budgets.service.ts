import type {
  BudgetFiltersInput,
  CreateBudgetRequestInput,
  RespondBudgetInput,
  ServiceUser,
  UpdateBudgetStatusInput,
} from '@epde/shared';
import { BudgetStatus, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRequest, Prisma } from '@prisma/client';

import {
  BudgetAccessDeniedError,
  BudgetNotPendingError,
  BudgetVersionConflictError,
  InvalidBudgetTransitionError,
} from '../common/exceptions/domain.exceptions';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { BudgetsRepository } from './budgets.repository';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  async listBudgets(filters: BudgetFiltersInput, currentUser: ServiceUser) {
    return this.budgetsRepository.findBudgets({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      propertyId: filters.propertyId,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : undefined,
    });
  }

  async getBudget(id: string, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    const budgetWithRelations = budget as BudgetRequest & {
      property?: { userId?: string };
    };
    try {
      if (
        currentUser.role === UserRole.CLIENT &&
        budgetWithRelations.property?.userId !== currentUser.id
      ) {
        throw new BudgetAccessDeniedError('ownership');
      }
    } catch (error) {
      if (error instanceof BudgetAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    return budget;
  }

  async createBudgetRequest(dto: CreateBudgetRequestInput, userId: string) {
    const property = await this.propertiesRepository.findOwnership(dto.propertyId);

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    const budget = await this.budgetsRepository.create(
      {
        propertyId: dto.propertyId,
        requestedBy: userId,
        createdBy: userId,
        title: dto.title,
        description: dto.description,
        status: BudgetStatus.PENDING,
      },
      {
        property: { select: { id: true, address: true, city: true } },
        requester: { select: { id: true, name: true } },
        lineItems: true,
        response: true,
      },
    );

    void this.notificationsHandler.handleBudgetCreated({
      budgetId: budget.id,
      title: dto.title,
      requesterId: userId,
      propertyId: dto.propertyId,
    });

    return budget;
  }

  async respondToBudget(id: string, dto: RespondBudgetInput, userId?: string) {
    const budget = await this.budgetsRepository.findById(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }
    const totalAmount = dto.lineItems.reduce(
      (sum, item) =>
        sum.add(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitPrice))),
      new Prisma.Decimal(0),
    );

    let result: BudgetRequest;
    try {
      // Fast-fail: reject early if not PENDING (repo re-checks atomically inside transaction)
      if (budget.status !== BudgetStatus.PENDING) {
        throw new BudgetNotPendingError();
      }

      result = await this.budgetsRepository.respondToBudget(
        id,
        budget.version ?? 0,
        dto.lineItems,
        {
          totalAmount: totalAmount.toNumber(),
          estimatedDays: dto.estimatedDays,
          notes: dto.notes,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          updatedBy: userId,
        },
      );
    } catch (error) {
      if (error instanceof BudgetNotPendingError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BudgetVersionConflictError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    void this.notificationsHandler.handleBudgetQuoted({
      budgetId: id,
      title: result.title,
      requesterId: result.requestedBy,
      totalAmount: totalAmount.toNumber(),
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateBudgetStatusInput, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    try {
      this.validateStatusTransition(
        budget.status,
        dto.status,
        currentUser,
        budget as BudgetRequest & { property?: { userId: string } | null },
      );
    } catch (error) {
      if (error instanceof InvalidBudgetTransitionError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BudgetAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    const updated = await this.budgetsRepository.update(
      id,
      { status: dto.status, updatedBy: currentUser.id },
      {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            user: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
        lineItems: true,
        response: true,
      },
    );

    void this.notificationsHandler.handleBudgetStatusChanged({
      budgetId: id,
      title: budget.title,
      oldStatus: budget.status,
      newStatus: dto.status,
      requesterId: budget.requestedBy,
    });

    return updated;
  }

  private validateStatusTransition(
    current: BudgetStatus,
    next: BudgetStatus,
    user: ServiceUser,
    budget: { property?: { userId: string } | null },
  ) {
    const allowedTransitions: Record<string, { status: BudgetStatus[]; role: UserRole }[]> = {
      [BudgetStatus.QUOTED]: [
        { status: [BudgetStatus.APPROVED, BudgetStatus.REJECTED], role: UserRole.CLIENT },
      ],
      [BudgetStatus.APPROVED]: [{ status: [BudgetStatus.IN_PROGRESS], role: UserRole.ADMIN }],
      [BudgetStatus.IN_PROGRESS]: [{ status: [BudgetStatus.COMPLETED], role: UserRole.ADMIN }],
    };

    const allowed = allowedTransitions[current];
    if (!allowed) {
      throw new InvalidBudgetTransitionError(current);
    }

    const match = allowed.find((a) => a.status.includes(next) && a.role === user.role);
    if (!match) {
      throw new BudgetAccessDeniedError('role');
    }

    if (user.role === UserRole.CLIENT && budget.property?.userId !== user.id) {
      throw new BudgetAccessDeniedError('ownership');
    }
  }
}
