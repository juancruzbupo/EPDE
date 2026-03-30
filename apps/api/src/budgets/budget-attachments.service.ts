import type { AddBudgetAttachmentsInput, ServiceUser } from '@epde/shared';
import { BUDGET_TERMINAL_STATUSES, BudgetStatus, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetRequest } from '@prisma/client';

import { BudgetAttachmentsRepository } from './budget-attachments.repository';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';
import { BudgetsRepository } from './budgets.repository';

@Injectable()
export class BudgetAttachmentsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly attachmentsRepository: BudgetAttachmentsRepository,
    private readonly auditLogRepository: BudgetAuditLogRepository,
  ) {}

  async addAttachments(budgetId: string, dto: AddBudgetAttachmentsInput, currentUser: ServiceUser) {
    const budget = await this.findBudgetOrFail(budgetId, currentUser);

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
