import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { ServiceRequestFiltersDto } from './dto/service-request-filters.dto';

interface CurrentUser {
  id: string;
  role: string;
}

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listRequests(filters: ServiceRequestFiltersDto, currentUser: CurrentUser) {
    return this.serviceRequestsRepository.findRequests({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      urgency: filters.urgency,
      propertyId: filters.propertyId,
      userId: currentUser.role === 'CLIENT' ? currentUser.id : undefined,
    });
  }

  async getRequest(id: string, currentUser: CurrentUser) {
    const request = await this.serviceRequestsRepository.findByIdWithDetails(id);
    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (currentUser.role === 'CLIENT' && (request as any).property?.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta solicitud');
    }

    return request;
  }

  async createRequest(dto: CreateServiceRequestDto, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const serviceRequest = await tx.serviceRequest.create({
        data: {
          propertyId: dto.propertyId,
          requestedBy: userId,
          title: dto.title,
          description: dto.description,
          urgency: (dto.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') ?? 'MEDIUM',
          status: 'OPEN',
        },
      });

      if (dto.photoUrls?.length) {
        await tx.serviceRequestPhoto.createMany({
          data: dto.photoUrls.map((url) => ({
            serviceRequestId: serviceRequest.id,
            url,
          })),
        });
      }

      return tx.serviceRequest.findUnique({
        where: { id: serviceRequest.id },
        include: {
          property: { select: { id: true, address: true, city: true } },
          requester: { select: { id: true, name: true } },
          photos: true,
        },
      });
    });

    this.eventEmitter.emit('service.created', {
      serviceRequestId: result!.id,
      title: dto.title,
      requesterId: userId,
      urgency: dto.urgency ?? 'MEDIUM',
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateServiceStatusDto) {
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
