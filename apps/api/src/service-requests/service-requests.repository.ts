import { Injectable } from '@nestjs/common';
import { Prisma, ServiceRequest, ServiceStatus, ServiceUrgency } from '@prisma/client';

import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

const TASK_BRIEF_SELECT = {
  id: true,
  name: true,
  category: { select: { id: true, name: true, icon: true } },
} as const;

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
  task: { select: TASK_BRIEF_SELECT },
} as const;

const SERVICE_REQUEST_DETAIL_INCLUDE = {
  ...SERVICE_REQUEST_LIST_INCLUDE,
  photos: true,
  attachments: true,
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
export class ServiceRequestsRepository extends BaseRepository<ServiceRequest, 'serviceRequest'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'serviceRequest', true);
  }

  async findRequests(params: {
    cursor?: string;
    take?: number;
    status?: ServiceStatus;
    urgency?: ServiceUrgency;
    propertyId?: string;
    search?: string;
    userId?: string;
  }): Promise<PaginatedResult<ServiceRequest>> {
    const where: Prisma.ServiceRequestWhereInput = {};

    if (params.status) where.status = params.status;
    if (params.urgency) where.urgency = params.urgency;
    if (params.propertyId) where.propertyId = params.propertyId;
    if (params.userId) where.requestedBy = params.userId;

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { property: { address: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: SERVICE_REQUEST_LIST_INCLUDE,
      count: false,
    };

    return this.findMany(findParams);
  }

  async findByIdWithDetails(id: string): Promise<ServiceRequestWithDetails | null> {
    return this.findById(
      id,
      SERVICE_REQUEST_DETAIL_INCLUDE,
    ) as Promise<ServiceRequestWithDetails | null>;
  }

  /**
   * Edit a service request — only allowed when status is OPEN.
   * Uses a transaction with a status check to prevent TOCTOU race conditions.
   */
  async editServiceRequest(
    id: string,
    data: { title?: string; description?: string; urgency?: ServiceUrgency },
    updatedBy: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.serviceRequest.findUnique({
        where: { id, deletedAt: null },
        select: { status: true, title: true, description: true },
      });

      if (!current || current.status !== ServiceStatus.OPEN) {
        return null;
      }

      return tx.serviceRequest.update({
        where: { id },
        data: { ...data, updatedBy },
        include: SERVICE_REQUEST_DETAIL_INCLUDE,
      });
    });
  }

  /** Find RESOLVED requests older than the given date (for auto-close scheduler). */
  async findStaleResolvedRequests(olderThan: Date) {
    return this.prisma.serviceRequest.findMany({
      where: {
        status: ServiceStatus.RESOLVED,
        deletedAt: null,
        updatedAt: { lt: olderThan },
      },
      select: { id: true, title: true, requestedBy: true },
      take: 1_000, // Safety bound for scheduler batch
    });
  }

  /** Batch-close resolved requests by IDs. */
  async closeRequests(ids: string[]) {
    return this.prisma.serviceRequest.updateMany({
      where: { id: { in: ids } },
      data: { status: ServiceStatus.CLOSED },
    });
  }

  /** Check that a task belongs to a property (via its maintenance plan). */
  async taskBelongsToProperty(taskId: string, propertyId: string): Promise<boolean> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null, maintenancePlan: { propertyId } },
      select: { id: true },
    });
    return !!task;
  }

  async createWithPhotos(data: {
    propertyId: string;
    requestedBy: string;
    taskId?: string;
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
            taskId: data.taskId ?? null,
            createdBy: data.createdBy,
            title: data.title,
            description: data.description,
            urgency: data.urgency,
            status: ServiceStatus.OPEN,
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

        // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- serviceRequest was just created in this transaction; soft-delete state is irrelevant.
        return tx.serviceRequest.findUnique({
          where: { id: serviceRequest.id },
          include: SERVICE_REQUEST_DETAIL_INCLUDE,
        });
      },
      { timeout: 30000 },
    );
  }
}
