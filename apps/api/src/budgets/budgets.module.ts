import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsRepository } from './budgets.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository, PropertiesRepository, PrismaService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
