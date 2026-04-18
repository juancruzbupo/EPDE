import type { CreatePaymentInput, UpdatePaymentStatusInput } from '@epde/shared';
import { createPaymentSchema, updatePaymentStatusSchema, UserRole } from '@epde/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@ApiTags('Profesionales')
@ApiBearerAuth()
@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('professionals/:id/payments')
  @Roles(UserRole.ADMIN)
  async list(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.list(id);
    return { data };
  }

  @Post('professionals/:id/payments')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createPaymentSchema)) dto: CreatePaymentInput,
  ) {
    const data = await this.service.create(id, dto);
    return { data, message: 'Pago registrado' };
  }

  @Patch('professional-payments/:paymentId')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body(new ZodValidationPipe(updatePaymentStatusSchema)) dto: UpdatePaymentStatusInput,
  ) {
    const data = await this.service.updateStatus(paymentId, dto);
    return { data, message: 'Pago actualizado' };
  }
}
