import type { AddServiceRequestAttachmentsInput, ServiceUser } from '@epde/shared';
import { isServiceRequestTerminal, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ServiceRequestTerminalError } from '../common/exceptions/domain.exceptions';
import { ServiceRequestAttachmentsRepository } from './service-request-attachments.repository';
import {
  ServiceRequestsRepository,
  type ServiceRequestWithDetails,
} from './service-requests.repository';

@Injectable()
export class ServiceRequestAttachmentsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly attachmentsRepository: ServiceRequestAttachmentsRepository,
  ) {}

  async addAttachments(
    id: string,
    dto: AddServiceRequestAttachmentsInput,
    currentUser: ServiceUser,
  ) {
    const request = await this.findRequestOrFail(id, currentUser);

    if (isServiceRequestTerminal(request.status)) {
      throw new BadRequestException(new ServiceRequestTerminalError('agregar adjuntos').message);
    }

    return this.attachmentsRepository.addAttachments(id, dto.attachments);
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async findRequestOrFail(id: string, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }
    this.assertAccess(request, currentUser);
    return request;
  }

  private assertAccess(request: ServiceRequestWithDetails, currentUser: ServiceUser): void {
    if (currentUser.role === UserRole.CLIENT && request.property?.userId !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a esta solicitud');
    }
  }
}
