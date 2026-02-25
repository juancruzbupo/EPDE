import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { UserRole } from '@epde/shared';
import type {
  CreateServiceRequestInput,
  UpdateServiceStatusInput,
  ServiceRequestFiltersInput,
} from '@epde/shared';

interface CurrentUser {
  id: string;
  role: string;
}

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listRequests(filters: ServiceRequestFiltersInput, currentUser: CurrentUser) {
    return this.serviceRequestsRepository.findRequests({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      urgency: filters.urgency,
      propertyId: filters.propertyId,
      userId: currentUser.role === UserRole.CLIENT ? currentUser.id : undefined,
    });
  }

  async getRequest(id: string, currentUser: CurrentUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    if (
      currentUser.role === UserRole.CLIENT &&
      (request as any).property?.userId !== currentUser.id
    ) {
      throw new ForbiddenException('No tenés acceso a esta solicitud');
    }

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
    const urgency = dto.urgency ?? 'MEDIUM';

    const result = await this.serviceRequestsRepository.createWithPhotos({
      propertyId: dto.propertyId,
      requestedBy: userId,
      title: dto.title,
      description: dto.description,
      urgency,
      photoUrls: dto.photoUrls,
    });

    this.eventEmitter.emit('service.created', {
      serviceRequestId: result!.id,
      title: dto.title,
      requesterId: userId,
      urgency,
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateServiceStatusInput) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    const updated = await this.serviceRequestsRepository.update(
      id,
      { status: dto.status },
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

    this.eventEmitter.emit('service.statusChanged', {
      serviceRequestId: id,
      title: request.title,
      oldStatus: request.status,
      newStatus: dto.status,
      requesterId: request.requestedBy,
    });

    return updated;
  }
}
