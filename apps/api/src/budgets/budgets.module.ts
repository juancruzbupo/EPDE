import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { PropertiesModule } from '../properties/properties.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
