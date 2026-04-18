import { Injectable } from '@nestjs/common';
import type { Prisma, ProfessionalPayment } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * ADR-011 category: sub-recurso — ProfessionalPayment is a child table of
 * Professional. Deliberately not extending BaseRepository: payments are
 * append-mostly (only status transitions after creation) and don't need
 * soft-delete semantics. Kept as a thin wrapper for the service layer so
 * that no-prisma-in-service stays green.
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByProfessional(professionalId: string): Promise<ProfessionalPayment[]> {
    return this.prisma.professionalPayment.findMany({
      where: { professionalId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ProfessionalPaymentUncheckedCreateInput): Promise<ProfessionalPayment> {
    return this.prisma.professionalPayment.create({ data });
  }

  async findById(id: string): Promise<ProfessionalPayment | null> {
    return this.prisma.professionalPayment.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.ProfessionalPaymentUpdateInput,
  ): Promise<ProfessionalPayment> {
    return this.prisma.professionalPayment.update({ where: { id }, data });
  }
}
