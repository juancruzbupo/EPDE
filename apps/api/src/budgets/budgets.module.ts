import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { PropertiesRepository } from '../properties/properties.repository';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository, PropertiesRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
