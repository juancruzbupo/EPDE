import { Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';
import {
  createBudgetRequestSchema,
  respondBudgetSchema,
  updateBudgetStatusSchema,
  budgetFiltersSchema,
  UserRole,
} from '@epde/shared';
import type {
  CreateBudgetRequestInput,
  RespondBudgetInput,
  UpdateBudgetStatusInput,
  BudgetFiltersInput,
  CurrentUser as CurrentUserPayload,
} from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

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
