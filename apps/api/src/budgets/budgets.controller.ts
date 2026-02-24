import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { CreateBudgetRequestDto } from './dto/create-budget-request.dto';
import { RespondBudgetDto } from './dto/respond-budget.dto';
import { UpdateBudgetStatusDto } from './dto/update-budget-status.dto';
import { BudgetFiltersDto } from './dto/budget-filters.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async listBudgets(
    @Query() filters: BudgetFiltersDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.budgetsService.listBudgets(filters, user);
  }

  @Get(':id')
  async getBudget(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    const data = await this.budgetsService.getBudget(id, user);
    return { data };
  }

  @Post()
  @Roles('CLIENT')
  async createBudgetRequest(
    @Body() dto: CreateBudgetRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.budgetsService.createBudgetRequest(dto, user.id);
    return { data, message: 'Presupuesto solicitado' };
  }

  @Post(':id/respond')
  @Roles('ADMIN')
  async respondToBudget(@Param('id') id: string, @Body() dto: RespondBudgetDto) {
    const data = await this.budgetsService.respondToBudget(id, dto);
    return { data, message: 'Presupuesto cotizado' };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetStatusDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.budgetsService.updateStatus(id, dto, user);
    return { data };
  }
}
