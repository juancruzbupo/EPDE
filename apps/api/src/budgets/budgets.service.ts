import type {
  AddBudgetAttachmentsInput,
  BudgetFiltersInput,
  CreateBudgetCommentInput,
  CreateBudgetRequestInput,
  EditBudgetRequestInput,
  RespondBudgetInput,
  ServiceUser,
  UpdateBudgetStatusInput,
} from '@epde/shared';
import { BUDGET_TERMINAL_STATUSES, BudgetStatus, UserRole } from '@epde/shared';
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
  BudgetNotEditableError,
  BudgetNotQuotableError,
  BudgetVersionConflictError,
  InvalidBudgetTransitionError,
} from '../common/exceptions/domain.exceptions';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { BudgetAttachmentsRepository } from './budget-attachments.repository';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';
import { BudgetCommentsRepository } from './budget-comments.repository';
import { BudgetsRepository } from './budgets.repository';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly auditLogRepository: BudgetAuditLogRepository,
    private readonly commentsRepository: BudgetCommentsRepository,
    private readonly attachmentsRepository: BudgetAttachmentsRepository,
  ) {}

  async listBudgets(filters: BudgetFiltersInput, currentUser: ServiceUser) {
    return this.budgetsRepository.findBudgets({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      propertyId: filters.propertyId,
      search: filters.search,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : (filters.userId ?? undefined),
    });
  }

  async getBudget(id: string, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    this.assertOwnership(budget as BudgetRequest & { property?: { userId?: string } }, currentUser);

    return budget;
  }

  async createBudgetRequest(dto: CreateBudgetRequestInput, userId: string) {
    const property = await this.propertiesRepository.findOwnership(dto.propertyId);

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException(new BudgetAccessDeniedError('ownership').message);
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
        attachments: true,
      },
    );

    void this.auditLogRepository.createAuditLog(
      budget.id,
      userId,
      'created',
      {},
      { title: dto.title },
    );

    void this.notificationsHandler.handleBudgetCreated({
      budgetId: budget.id,
      title: dto.title,
      requesterId: userId,
    });

    return budget;
  }

  async editBudgetRequest(id: string, dto: EditBudgetRequestInput, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    this.assertOwnership(budget as BudgetRequest & { property?: { userId?: string } }, currentUser);

    let result: BudgetRequest;
    try {
      if (budget.status !== BudgetStatus.PENDING) {
        throw new BudgetNotEditableError();
      }
      result = await this.budgetsRepository.editBudgetRequest(
        id,
        budget.version ?? 0,
        dto,
        currentUser.id,
      );
    } catch (error) {
      if (error instanceof BudgetNotEditableError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BudgetVersionConflictError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    void this.auditLogRepository.createAuditLog(
      id,
      currentUser.id,
      'edited',
      { title: budget.title, description: budget.description },
      { title: dto.title ?? budget.title, description: dto.description ?? budget.description },
    );

    return result;
  }

  async respondToBudget(id: string, dto: RespondBudgetInput, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findById(id);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }
    const totalAmount = dto.lineItems.reduce(
      (sum, item) =>
        sum.add(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitPrice))),
      new Prisma.Decimal(0),
    );

    const wasQuoted = budget.status === BudgetStatus.QUOTED;
    let result: BudgetRequest;
    try {
      // Fast-fail: reject early if not quotable (repo re-checks atomically inside transaction)
      if (budget.status !== BudgetStatus.PENDING && budget.status !== BudgetStatus.QUOTED) {
        throw new BudgetNotQuotableError();
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
          updatedBy: currentUser.id,
        },
      );
    } catch (error) {
      if (error instanceof BudgetNotQuotableError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BudgetVersionConflictError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    void this.auditLogRepository.createAuditLog(
      id,
      currentUser.id,
      wasQuoted ? 're-quoted' : 'quoted',
      { status: budget.status },
      { status: BudgetStatus.QUOTED, totalAmount: totalAmount.toNumber() },
    );

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

    const updated = await this.budgetsRepository.updateStatusAtomic(
      id,
      dto.status,
      budget.version,
      currentUser.id,
    );

    void this.auditLogRepository.createAuditLog(
      id,
      currentUser.id,
      dto.status.toLowerCase(),
      { status: budget.status },
      { status: dto.status },
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

  // ─── Comments ────────────────────────────────────────────

  async getComments(budgetId: string, currentUser: ServiceUser) {
    await this.getBudget(budgetId, currentUser);
    return this.commentsRepository.findByBudgetId(budgetId);
  }

  async addComment(budgetId: string, dto: CreateBudgetCommentInput, currentUser: ServiceUser) {
    const budget = await this.getBudget(budgetId, currentUser);

    if (BUDGET_TERMINAL_STATUSES.includes(budget.status as BudgetStatus)) {
      throw new BadRequestException('No se pueden agregar comentarios a un presupuesto finalizado');
    }

    const comment = await this.commentsRepository.createComment(
      budgetId,
      currentUser.id,
      dto.content,
    );

    void this.notificationsHandler.handleBudgetCommentAdded({
      budgetId,
      title: budget.title,
      commentAuthorId: currentUser.id,
      requesterId: budget.requestedBy,
    });

    void this.auditLogRepository.createAuditLog(
      budgetId,
      currentUser.id,
      'comment_added',
      {},
      { commentId: comment.id },
    );

    return comment;
  }

  // ─── Attachments ─────────────────────────────────────────

  async addAttachments(budgetId: string, dto: AddBudgetAttachmentsInput, currentUser: ServiceUser) {
    const budget = await this.getBudget(budgetId, currentUser);

    if (BUDGET_TERMINAL_STATUSES.includes(budget.status as BudgetStatus)) {
      throw new BadRequestException('No se pueden agregar adjuntos a un presupuesto finalizado');
    }

    const attachments = await this.attachmentsRepository.addAttachments(budgetId, dto.attachments);

    void this.auditLogRepository.createAuditLog(
      budgetId,
      currentUser.id,
      'attachments_added',
      {},
      { count: dto.attachments.length },
    );

    return attachments;
  }

  // ─── Audit Log ───────────────────────────────────────────

  async getAuditLog(budgetId: string, currentUser: ServiceUser) {
    await this.getBudget(budgetId, currentUser);
    return this.auditLogRepository.findByBudgetId(budgetId);
  }

  // ─── Helpers ─────────────────────────────────────────────

  private assertOwnership(
    budget: BudgetRequest & { property?: { userId?: string } | null },
    currentUser: ServiceUser,
  ) {
    if (currentUser.role === UserRole.CLIENT && budget.property?.userId !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a este presupuesto');
    }
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
