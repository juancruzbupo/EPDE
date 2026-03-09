import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
