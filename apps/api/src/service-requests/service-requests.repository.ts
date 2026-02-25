import { Injectable } from '@nestjs/common';
import { ServiceRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';

const SERVICE_REQUEST_INCLUDE = {
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
  photos: true,
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
      include: SERVICE_REQUEST_INCLUDE,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<ServiceRequest | null> {
    return this.findById(id, SERVICE_REQUEST_INCLUDE);
  }
}
