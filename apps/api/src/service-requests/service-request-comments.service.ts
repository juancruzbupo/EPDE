import type { CreateServiceRequestCommentInput, ServiceUser } from '@epde/shared';
import { isServiceRequestTerminal, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ServiceRequestTerminalError } from '../common/exceptions/domain.exceptions';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { ServiceRequestCommentsRepository } from './service-request-comments.repository';
import {
  ServiceRequestsRepository,
  type ServiceRequestWithDetails,
} from './service-requests.repository';

@Injectable()
export class ServiceRequestCommentsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly commentsRepository: ServiceRequestCommentsRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  async getComments(id: string, currentUser: ServiceUser) {
    await this.findRequestOrFail(id, currentUser);
    return this.commentsRepository.findByServiceRequestId(id);
  }

  async addComment(id: string, dto: CreateServiceRequestCommentInput, currentUser: ServiceUser) {
    const request = await this.findRequestOrFail(id, currentUser);

    if (isServiceRequestTerminal(request.status)) {
      throw new BadRequestException(new ServiceRequestTerminalError('comentar').message);
    }

    const comment = await this.commentsRepository.createComment(id, currentUser.id, dto.content);

    void this.notificationsHandler.handleServiceCommentAdded({
      serviceRequestId: id,
      title: request.title,
      commentAuthorId: currentUser.id,
      requesterId: request.requestedBy,
    });

    return comment;
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
