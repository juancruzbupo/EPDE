import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { BudgetAttachmentsRepository } from './budget-attachments.repository';
import { BudgetAttachmentsService } from './budget-attachments.service';
import { BudgetAuditLogRepository } from './budget-audit-log.repository';
import { BudgetCommentsRepository } from './budget-comments.repository';
import { BudgetCommentsService } from './budget-comments.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

/**
 * BudgetsModule — cross-module dependencies (explicit):
 *
 *   NotificationsModule → NotificationsHandlerService
 *     Used by BudgetsService to fire status-change notifications (BUDGET_UPDATE).
 *     NotificationsHandlerService is the domain handler — not NotificationsService
 *     — so BudgetsService is decoupled from the CRUD layer of notifications.
 *
 *   PropertiesModule → PropertiesRepository
 *     Used by BudgetsService to verify property ownership before allowing
 *     budget creation or status transitions (budget.property.userId === currentUser.id).
 *     PropertiesRepository is injected directly (not PropertiesService) to avoid
 *     coupling to property business logic that BudgetsService doesn't need.
 *
 * Both imports use the narrowest available interface. If either upstream module
 * adds a breaking change to the injected symbol, fix only the usage in BudgetsService.
 */
@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    BudgetCommentsService,
    BudgetAttachmentsService,
    BudgetsRepository,
    BudgetAuditLogRepository,
    BudgetCommentsRepository,
    BudgetAttachmentsRepository,
  ],
  exports: [BudgetsService, BudgetsRepository, BudgetAuditLogRepository],
})
export class BudgetsModule {}
