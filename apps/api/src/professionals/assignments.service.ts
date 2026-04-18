import type { CreateAssignmentInput } from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AssignmentsRepository } from './assignments.repository';

/**
 * ServiceRequest <-> Professional assignment.
 *
 * Rules:
 * - 1:1 per SR (unique constraint)
 * - Blocked professionals cannot receive new assignments (existing ones stay
 *   until SR closes, per user decision in ADR-018)
 */
@Injectable()
export class AssignmentsService {
  constructor(private readonly repo: AssignmentsRepository) {}

  async assign(serviceRequestId: string, dto: CreateAssignmentInput, assignedBy: string) {
    const [sr, professional, existing] = await Promise.all([
      this.repo.findServiceRequest(serviceRequestId),
      this.repo.findProfessionalWithPrimary(dto.professionalId),
      this.repo.findAssignment(serviceRequestId),
    ]);

    if (!sr) throw new NotFoundException('Solicitud no encontrada');
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    if (professional.tier === 'BLOCKED') {
      throw new BadRequestException('No se puede asignar un profesional bloqueado');
    }
    if (existing) {
      throw new ConflictException(
        'La solicitud ya tiene profesional asignado. Primero remové el actual.',
      );
    }
    if (sr.status === 'CLOSED') {
      throw new BadRequestException('No se puede asignar profesional a una solicitud cerrada');
    }

    const assignment = await this.repo.create({
      serviceRequestId,
      professionalId: dto.professionalId,
      assignedBy,
    });

    return {
      id: assignment.id,
      serviceRequestId: assignment.serviceRequestId,
      professionalId: assignment.professionalId,
      professionalName: professional.name,
      professionalSpecialty: professional.specialties[0]?.specialty ?? null,
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy,
    };
  }

  async unassign(serviceRequestId: string) {
    const existing = await this.repo.findAssignment(serviceRequestId);
    if (!existing) throw new NotFoundException('No hay asignación activa');
    await this.repo.delete(serviceRequestId);
  }
}
