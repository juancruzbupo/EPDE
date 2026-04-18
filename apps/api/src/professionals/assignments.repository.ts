import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Professional,
  ProfessionalSpecialtyAssignment,
  ServiceRequest,
  ServiceRequestAssignment,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * ADR-011 category: cross-model — orchestrates reads against ServiceRequest
 * AND Professional before persisting a ServiceRequestAssignment. Doesn't
 * extend BaseRepository because it doesn't own a single entity; the
 * ServiceRequestAssignment table is managed here because no other domain
 * has a legitimate reason to reach into it.
 */
@Injectable()
export class AssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findServiceRequest(id: string): Promise<Pick<ServiceRequest, 'id' | 'status'> | null> {
    return this.prisma.serviceRequest.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
  }

  async findProfessionalWithPrimary(id: string): Promise<
    | (Pick<Professional, 'id' | 'tier' | 'name'> & {
        specialties: Pick<ProfessionalSpecialtyAssignment, 'specialty'>[];
      })
    | null
  > {
    return this.prisma.professional.findFirst({
      where: { id, deletedAt: null },
      include: { specialties: { where: { isPrimary: true }, take: 1 } },
    });
  }

  async findAssignment(serviceRequestId: string): Promise<ServiceRequestAssignment | null> {
    return this.prisma.serviceRequestAssignment.findUnique({ where: { serviceRequestId } });
  }

  async create(
    data: Prisma.ServiceRequestAssignmentUncheckedCreateInput,
  ): Promise<ServiceRequestAssignment> {
    return this.prisma.serviceRequestAssignment.create({ data });
  }

  async delete(serviceRequestId: string): Promise<void> {
    await this.prisma.serviceRequestAssignment.delete({ where: { serviceRequestId } });
  }
}
