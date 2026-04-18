import type { CreatePaymentInput, UpdatePaymentStatusInput } from '@epde/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PaymentsRepository } from './payments.repository';
import { ProfessionalsRepository } from './professionals.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly professionals: ProfessionalsRepository,
  ) {}

  async list(professionalId: string) {
    return this.repo.listByProfessional(professionalId);
  }

  async create(professionalId: string, dto: CreatePaymentInput) {
    const professional = await this.professionals.findById(professionalId);
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    return this.repo.create({
      professionalId,
      serviceRequestId: dto.serviceRequestId ?? null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod ?? null,
      notes: dto.notes ?? null,
      status: 'PENDING',
    });
  }

  async updateStatus(paymentId: string, dto: UpdatePaymentStatusInput) {
    const existing = await this.repo.findById(paymentId);
    if (!existing) throw new NotFoundException('Pago no encontrado');

    return this.repo.update(paymentId, {
      status: dto.status,
      paidAt: dto.status === 'PAID' ? new Date() : null,
      paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
      receiptUrl: dto.receiptUrl ?? existing.receiptUrl,
    });
  }
}
