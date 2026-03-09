import type {
  BudgetFiltersInput,
  CreateBudgetRequestInput,
  CurrentUser as CurrentUserPayload,
  RespondBudgetInput,
  UpdateBudgetStatusInput,
} from '@epde/shared';
import {
  budgetFiltersSchema,
  createBudgetRequestSchema,
  respondBudgetSchema,
  updateBudgetStatusSchema,
  UserRole,
} from '@epde/shared';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BudgetsService } from './budgets.service';

@ApiTags('Presupuestos')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listBudgets(
    @Query(new ZodValidationPipe(budgetFiltersSchema)) filters: BudgetFiltersInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.listBudgets(filters, user);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getBudget(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.budgetsService.getBudget(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.CLIENT)
  async createBudgetRequest(
    @Body(new ZodValidationPipe(createBudgetRequestSchema)) dto: CreateBudgetRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.createBudgetRequest(dto, user.id);
    return { data, message: 'Presupuesto solicitado' };
  }

  @Post(':id/respond')
  @Roles(UserRole.ADMIN)
  async respondToBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(respondBudgetSchema)) dto: RespondBudgetInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.respondToBudget(id, dto, user.id);
    return { data, message: 'Presupuesto cotizado' };
  }

  @Patch(':id/status')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBudgetStatusSchema)) dto: UpdateBudgetStatusInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.updateStatus(id, dto, user);
    return { data };
  }
}
