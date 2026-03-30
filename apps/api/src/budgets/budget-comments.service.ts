import type { CreateBudgetCommentInput, ServiceUser } from '@epde/shared';
import { BUDGET_TERMINAL_STATUSES, BudgetStatus, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRequest } from '@prisma/client';

import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';
import { BudgetCommentsRepository } from './budget-comments.repository';
import { BudgetsRepository } from './budgets.repository';

@Injectable()
export class BudgetCommentsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly commentsRepository: BudgetCommentsRepository,
    private readonly auditLogRepository: BudgetAuditLogRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  async getComments(budgetId: string, currentUser: ServiceUser) {
    await this.findBudgetOrFail(budgetId, currentUser);
    return this.commentsRepository.findByBudgetId(budgetId);
  }

  async addComment(budgetId: string, dto: CreateBudgetCommentInput, currentUser: ServiceUser) {
    const budget = await this.findBudgetOrFail(budgetId, currentUser);

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

  // ─── Helpers ─────────────────────────────────────────────

  private async findBudgetOrFail(budgetId: string, currentUser: ServiceUser) {
    const budget = await this.budgetsRepository.findByIdWithDetails(budgetId);
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    this.assertOwnership(budget as BudgetRequest & { property?: { userId?: string } }, currentUser);

    return budget;
  }

  private assertOwnership(
    budget: BudgetRequest & { property?: { userId?: string } | null },
    currentUser: ServiceUser,
  ) {
    if (currentUser.role === UserRole.CLIENT && budget.property?.userId !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a este presupuesto');
    }
  }
}
