import type {
  CreateServiceRequestInput,
  ServiceRequestFiltersInput,
  ServiceUser,
  UpdateServiceStatusInput,
} from '@epde/shared';
import { ServiceUrgency, UserRole } from '@epde/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import {
  ServiceRequestsRepository,
  type ServiceRequestWithDetails,
} from './service-requests.repository';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  async listRequests(filters: ServiceRequestFiltersInput, currentUser: ServiceUser) {
    return this.serviceRequestsRepository.findRequests({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      urgency: filters.urgency,
      propertyId: filters.propertyId,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : undefined,
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

    if (property.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    // Zod applies default('MEDIUM'), so urgency is always present after validation
    const urgency = dto.urgency ?? ServiceUrgency.MEDIUM;

    const result = await this.serviceRequestsRepository.createWithPhotos({
      propertyId: dto.propertyId,
      requestedBy: userId,
      createdBy: userId,
      title: dto.title,
      description: dto.description,
      urgency,
      photoUrls: dto.photoUrls,
    });

    void this.notificationsHandler.handleServiceCreated({
      serviceRequestId: result!.id,
      title: dto.title,
      requesterId: userId,
      urgency,
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateServiceStatusInput, currentUser: ServiceUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    this.assertAccess(request, currentUser);

    const updated = await this.serviceRequestsRepository.update(
      id,
      { status: dto.status, updatedBy: currentUser.id },
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
      },
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

  private assertAccess(request: ServiceRequestWithDetails, currentUser: ServiceUser): void {
    if (currentUser.role === UserRole.CLIENT && request.property?.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta solicitud');
    }
  }
}
