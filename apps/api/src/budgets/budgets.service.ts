import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { BudgetsRepository } from './budgets.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { UserRole } from '@epde/shared';
import type {
  CreateBudgetRequestInput,
  RespondBudgetInput,
  UpdateBudgetStatusInput,
  BudgetFiltersInput,
} from '@epde/shared';

interface CurrentUser {
  id: string;
  role: string;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listBudgets(filters: BudgetFiltersInput, currentUser: CurrentUser) {
    return this.budgetsRepository.findBudgets({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      propertyId: filters.propertyId,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : undefined,
    });
  }

  async getBudget(id: string, currentUser: CurrentUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (
      currentUser.role === UserRole.CLIENT &&
      (budget as any).property?.userId !== currentUser.id
    ) {
      throw new ForbiddenException('No tenés acceso a este presupuesto');
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

    this.eventEmitter.emit('budget.created', {
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

    if (budget.status !== 'PENDING') {
      throw new BadRequestException('Solo se puede cotizar un presupuesto pendiente');
    }

    const totalAmount = dto.lineItems.reduce(
      (sum, item) =>
        sum.add(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitPrice))),
      new Prisma.Decimal(0),
    );

    const result = await this.budgetsRepository.respondToBudget(id, dto.lineItems, {
      totalAmount: totalAmount.toNumber(),
      estimatedDays: dto.estimatedDays,
      notes: dto.notes,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      updatedBy: userId,
    });

    this.eventEmitter.emit('budget.quoted', {
      budgetId: id,
      title: result.title,
      requesterId: result.requestedBy,
      totalAmount,
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateBudgetStatusInput, currentUser: CurrentUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    this.validateStatusTransition(budget.status, dto.status, currentUser, budget);

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

    this.eventEmitter.emit('budget.statusChanged', {
      budgetId: id,
      title: budget.title,
      oldStatus: budget.status,
      newStatus: dto.status,
      requesterId: budget.requestedBy,
    });

    return updated;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validateStatusTransition(current: string, next: string, user: CurrentUser, budget: any) {
    const allowedTransitions: Record<string, { status: string[]; role: string }[]> = {
      QUOTED: [{ status: ['APPROVED', 'REJECTED'], role: UserRole.CLIENT }],
      APPROVED: [{ status: ['IN_PROGRESS'], role: UserRole.ADMIN }],
      IN_PROGRESS: [{ status: ['COMPLETED'], role: UserRole.ADMIN }],
    };

    const allowed = allowedTransitions[current];
    if (!allowed) {
      throw new BadRequestException(`No se puede cambiar el estado desde ${current}`);
    }

    const match = allowed.find((a) => a.status.includes(next) && a.role === user.role);
    if (!match) {
      throw new ForbiddenException('No tenés permisos para esta transición de estado');
    }

    if (user.role === UserRole.CLIENT && budget.property?.userId !== user.id) {
      throw new ForbiddenException('No tenés acceso a este presupuesto');
    }
  }
}
