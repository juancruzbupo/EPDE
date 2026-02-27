import { Injectable } from '@nestjs/common';
import { ServiceRequest, ServiceUrgency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';

const SERVICE_REQUEST_LIST_INCLUDE = {
  property: {
    select: {
      id: true,
      address: true,
      city: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
  requester: { select: { id: true, name: true, email: true } },
} as const;

const SERVICE_REQUEST_DETAIL_INCLUDE = {
  ...SERVICE_REQUEST_LIST_INCLUDE,
  photos: true,
} as const;

export type ServiceRequestWithDetails = ServiceRequest & {
  property: {
    id: string;
    address: string;
    city: string;
    userId: string;
    user: { id: string; name: string };
  } | null;
  requester: { id: string; name: string; email: string } | null;
  photos: { id: string; url: string; serviceRequestId: string }[];
};

@Injectable()
export class ServiceRequestsRepository extends BaseRepository<ServiceRequest> {
  constructor(prisma: PrismaService) {
    super(prisma, 'serviceRequest', false);
  }

  async findRequests(params: {
    cursor?: string;
    take?: number;
    status?: string;
    urgency?: string;
    propertyId?: string;
    userId?: string;
  }): Promise<PaginatedResult<ServiceRequest>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.urgency) where.urgency = params.urgency;
    if (params.propertyId) where.propertyId = params.propertyId;
    if (params.userId) where.property = { userId: params.userId };

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: SERVICE_REQUEST_LIST_INCLUDE,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<ServiceRequestWithDetails | null> {
    return this.findById(
      id,
      SERVICE_REQUEST_DETAIL_INCLUDE,
    ) as Promise<ServiceRequestWithDetails | null>;
  }

  async createWithPhotos(data: {
    propertyId: string;
    requestedBy: string;
    title: string;
    description: string;
    urgency: ServiceUrgency;
    photoUrls?: string[];
    createdBy?: string;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const serviceRequest = await tx.serviceRequest.create({
          data: {
            propertyId: data.propertyId,
            requestedBy: data.requestedBy,
            createdBy: data.createdBy,
            title: data.title,
            description: data.description,
            urgency: data.urgency,
            status: 'OPEN',
          },
        });

        if (data.photoUrls?.length) {
          await tx.serviceRequestPhoto.createMany({
            data: data.photoUrls.map((url) => ({
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
      },
      { timeout: 30000 },
    );
  }
}
