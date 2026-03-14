import type {
  AddBudgetAttachmentsInput,
  BudgetFiltersInput,
  CreateBudgetCommentInput,
  CreateBudgetRequestInput,
  CurrentUser as CurrentUserPayload,
  EditBudgetRequestInput,
  RespondBudgetInput,
  UpdateBudgetStatusInput,
} from '@epde/shared';
import {
  addBudgetAttachmentsSchema,
  budgetFiltersSchema,
  createBudgetCommentSchema,
  createBudgetRequestSchema,
  editBudgetRequestSchema,
  respondBudgetSchema,
  updateBudgetStatusSchema,
  UserRole,
} from '@epde/shared';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

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

  @Get(':id/audit-log')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getAuditLog(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.getAuditLog(id, user);
    return { data };
  }

  @Get(':id/comments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.getComments(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async createBudgetRequest(
    @Body(new ZodValidationPipe(createBudgetRequestSchema)) dto: CreateBudgetRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.createBudgetRequest(dto, user.id);
    return { data, message: 'Presupuesto solicitado' };
  }

  @Post(':id/respond')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async respondToBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(respondBudgetSchema)) dto: RespondBudgetInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.respondToBudget(id, dto, user.id);
    return { data, message: 'Presupuesto cotizado' };
  }

  @Post(':id/comments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createBudgetCommentSchema)) dto: CreateBudgetCommentInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.addComment(id, dto, user);
    return { data, message: 'Comentario agregado' };
  }

  @Post(':id/attachments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async addAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addBudgetAttachmentsSchema)) dto: AddBudgetAttachmentsInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.addAttachments(id, dto, user);
    return { data, message: 'Adjuntos agregados' };
  }

  @Patch(':id/status')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBudgetStatusSchema)) dto: UpdateBudgetStatusInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.updateStatus(id, dto, user);
    return { data, message: 'Estado del presupuesto actualizado' };
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  async editBudgetRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(editBudgetRequestSchema)) dto: EditBudgetRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.budgetsService.editBudgetRequest(id, dto, user);
    return { data, message: 'Presupuesto actualizado' };
  }
}
