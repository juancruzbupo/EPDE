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
