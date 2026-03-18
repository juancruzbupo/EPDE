import type {
  AddServiceRequestAttachmentsInput,
  CreateServiceRequestCommentInput,
  CreateServiceRequestInput,
  EditServiceRequestInput,
  ServiceRequestFiltersInput,
  ServiceUser,
  UpdateServiceStatusInput,
} from '@epde/shared';
import { isServiceRequestTerminal, ServiceStatus, ServiceUrgency, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InvalidServiceStatusTransitionError,
  ServiceRequestAccessDeniedError,
  ServiceRequestNotEditableError,
  ServiceRequestTerminalError,
  TaskPropertyMismatchError,
} from '../common/exceptions/domain.exceptions';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { ServiceRequestAttachmentsRepository } from './service-request-attachments.repository';
import { ServiceRequestAuditLogRepository } from './service-request-audit-log.repository';
import { ServiceRequestCommentsRepository } from './service-request-comments.repository';
import {
  ServiceRequestsRepository,
  type ServiceRequestWithDetails,
} from './service-requests.repository';

/** Linear status machine: OPEN → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED */
const VALID_TRANSITIONS: Record<string, ServiceStatus> = {
  [ServiceStatus.OPEN]: ServiceStatus.IN_REVIEW,
  [ServiceStatus.IN_REVIEW]: ServiceStatus.IN_PROGRESS,
  [ServiceStatus.IN_PROGRESS]: ServiceStatus.RESOLVED,
  [ServiceStatus.RESOLVED]: ServiceStatus.CLOSED,
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly auditLogRepository: ServiceRequestAuditLogRepository,
    private readonly commentsRepository: ServiceRequestCommentsRepository,
    private readonly attachmentsRepository: ServiceRequestAttachmentsRepository,
  ) {}

  async listRequests(filters: ServiceRequestFiltersInput, currentUser: ServiceUser) {
    return this.serviceRequestsRepository.findRequests({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      urgency: filters.urgency,
      propertyId: filters.propertyId,
      search: filters.search,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : (filters.userId ?? undefined),
    });
  }

  async getRequest(id: string, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    this.assertAccess(request, currentUser);

    return request;
  }

  async createRequest(dto: CreateServiceRequestInput, userId: string) {
    const property = await this.propertiesRepository.findOwnership(dto.propertyId);

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    try {
      if (property.userId !== userId) {
        throw new ServiceRequestAccessDeniedError('ownership');
      }
    } catch (error) {
      if (error instanceof ServiceRequestAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    // If a task is linked, validate it belongs to the same property
    if (dto.taskId) {
      await this.validateTaskBelongsToProperty(dto.taskId, dto.propertyId);
    }

    // Zod applies default('MEDIUM'), so urgency is always present after validation
    const urgency = dto.urgency ?? ServiceUrgency.MEDIUM;

    const result = await this.serviceRequestsRepository.createWithPhotos({
      propertyId: dto.propertyId,
      requestedBy: userId,
      createdBy: userId,
      taskId: dto.taskId,
      title: dto.title,
      description: dto.description,
      urgency,
      photoUrls: dto.photoUrls,
    });

    // Audit log: created
    void this.auditLogRepository.createAuditLog(
      result!.id,
      userId,
      'created',
      {},
      {
        title: dto.title,
        description: dto.description,
        urgency,
        taskId: dto.taskId ?? null,
        photoCount: dto.photoUrls?.length ?? 0,
      },
    );

    void this.notificationsHandler.handleServiceCreated({
      serviceRequestId: result!.id,
      title: dto.title,
      requesterId: userId,
      urgency,
    });

    return result;
  }

  async editServiceRequest(id: string, dto: EditServiceRequestInput, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    this.assertAccess(request, currentUser);

    try {
      if (currentUser.role !== UserRole.CLIENT) {
        throw new ServiceRequestAccessDeniedError('role');
      }
    } catch (error) {
      if (error instanceof ServiceRequestAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    try {
      const updated = await this.serviceRequestsRepository.editServiceRequest(
        id,
        dto,
        currentUser.id,
      );

      if (!updated) {
        throw new ServiceRequestNotEditableError();
      }

      // Audit log: edited
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      if (dto.title && dto.title !== request.title) {
        before.title = request.title;
        after.title = dto.title;
      }
      if (dto.description && dto.description !== request.description) {
        before.description = request.description;
        after.description = dto.description;
      }
      if (dto.urgency && dto.urgency !== request.urgency) {
        before.urgency = request.urgency;
        after.urgency = dto.urgency;
      }
      void this.auditLogRepository.createAuditLog(id, currentUser.id, 'edited', before, after);

      return updated;
    } catch (e) {
      if (e instanceof ServiceRequestNotEditableError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  async updateStatus(id: string, dto: UpdateServiceStatusInput, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    this.assertAccess(request, currentUser);

    try {
      const allowedNext = VALID_TRANSITIONS[request.status];
      if (!allowedNext || allowedNext !== dto.status) {
        throw new InvalidServiceStatusTransitionError(request.status, dto.status);
      }
    } catch (e) {
      if (e instanceof InvalidServiceStatusTransitionError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    // Auto-track SLA timestamps on key transitions
    const slaData: Record<string, Date> = {};
    if (dto.status === ServiceStatus.IN_REVIEW && !request.firstResponseAt) {
      slaData.firstResponseAt = new Date();
    }
    if (dto.status === ServiceStatus.RESOLVED && !request.resolvedAt) {
      slaData.resolvedAt = new Date();
    }

    const updated = await this.serviceRequestsRepository.update(
      id,
      { status: dto.status, updatedBy: currentUser.id, ...slaData },
      {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            user: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
        photos: true,
        attachments: true,
      },
    );

    // Audit log: status transition with optional admin note
    const auditAfter: Record<string, unknown> = {
      status: dto.status,
    };
    if (dto.note) {
      auditAfter.note = dto.note;
    }
    void this.auditLogRepository.createAuditLog(
      id,
      currentUser.id,
      dto.status.toLowerCase().replace('_', '-'),
      { status: request.status },
      auditAfter,
    );

    void this.notificationsHandler.handleServiceStatusChanged({
      serviceRequestId: id,
      title: request.title,
      oldStatus: request.status,
      newStatus: dto.status,
      requesterId: request.requestedBy,
    });

    return updated;
  }

  // ─── Audit Log ──────────────────────────────────────────

  async getAuditLog(id: string, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }
    this.assertAccess(request, currentUser);
    return this.auditLogRepository.findByServiceRequestId(id);
  }

  // ─── Comments ───────────────────────────────────────────

  async getComments(id: string, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }
    this.assertAccess(request, currentUser);
    return this.commentsRepository.findByServiceRequestId(id);
  }

  async addComment(id: string, dto: CreateServiceRequestCommentInput, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }
    this.assertAccess(request, currentUser);

    try {
      if (isServiceRequestTerminal(request.status)) {
        throw new ServiceRequestTerminalError('comentar');
      }
    } catch (error) {
      if (error instanceof ServiceRequestTerminalError) {
        throw new BadRequestException(error.message);
      }
      throw error;
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

  // ─── Attachments ────────────────────────────────────────

  async addAttachments(
    id: string,
    dto: AddServiceRequestAttachmentsInput,
    currentUser: ServiceUser,
  ) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }
    this.assertAccess(request, currentUser);

    try {
      if (isServiceRequestTerminal(request.status)) {
        throw new ServiceRequestTerminalError('agregar adjuntos');
      }
    } catch (error) {
      if (error instanceof ServiceRequestTerminalError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return this.attachmentsRepository.addAttachments(id, dto.attachments);
  }

  /** Validate that the given task belongs to the property (via its maintenance plan). */
  private async validateTaskBelongsToProperty(taskId: string, propertyId: string): Promise<void> {
    const belongs = await this.serviceRequestsRepository.taskBelongsToProperty(taskId, propertyId);
    if (!belongs) {
      throw new BadRequestException(new TaskPropertyMismatchError().message);
    }
  }

  private assertAccess(request: ServiceRequestWithDetails, currentUser: ServiceUser): void {
    if (currentUser.role === UserRole.CLIENT && request.property?.userId !== currentUser.id) {
      throw new ForbiddenException(new ServiceRequestAccessDeniedError('ownership').message);
    }
  }
}
