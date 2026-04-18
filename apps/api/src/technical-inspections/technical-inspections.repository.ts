import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  TechnicalInspection,
  TechnicalInspectionPaymentStatus,
  TechnicalInspectionStatus,
  TechnicalInspectionType,
} from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

const TECHNICAL_INSPECTION_INCLUDE = {
  property: { select: { id: true, address: true, city: true, userId: true } },
  requester: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class TechnicalInspectionsRepository extends BaseRepository<
  TechnicalInspection,
  'technicalInspection',
  Prisma.TechnicalInspectionCreateInput,
  Prisma.TechnicalInspectionUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'technicalInspection', true);
  }

  async findManyWithFilters(filters: {
    cursor?: string;
    take: number;
    status?: TechnicalInspectionStatus;
    type?: TechnicalInspectionType;
    propertyId?: string;
    feeStatus?: TechnicalInspectionPaymentStatus;
    /** When set, restricts to this user's requests only (client-scoped). */
    requestedBy?: string;
  }) {
    const where: Prisma.TechnicalInspectionWhereInput = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.feeStatus) where.feeStatus = filters.feeStatus;
    if (filters.requestedBy) where.requestedBy = filters.requestedBy;

    const take = Math.min(Math.max(filters.take, 1), 100);

    const [total, rows] = await Promise.all([
      this.prisma.technicalInspection.count({ where }),
      this.prisma.technicalInspection.findMany({
        where,
        include: TECHNICAL_INSPECTION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      }),
    ]);

    const hasMore = rows.length > take;
    const data = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor, hasMore, total };
  }

  async findByIdWithIncludes(id: string) {
    return this.prisma.technicalInspection.findFirst({
      where: { id, deletedAt: null },
      include: TECHNICAL_INSPECTION_INCLUDE,
    });
  }

  async createWithInclude(data: Prisma.TechnicalInspectionUncheckedCreateInput) {
    return this.prisma.technicalInspection.create({
      data,
      include: TECHNICAL_INSPECTION_INCLUDE,
    });
  }

  async updateWithInclude(id: string, data: Prisma.TechnicalInspectionUpdateInput) {
    return this.prisma.technicalInspection.update({
      where: { id },
      data,
      include: TECHNICAL_INSPECTION_INCLUDE,
    });
  }

  /**
   * Atomic counter for INSP-YYYY-NNNN numbering. Uses upsert on the singleton
   * row; yearlyCounters is a JSON blob with { [year: string]: number }.
   */
  async getNextInspectionNumber(year: number): Promise<string> {
    const yearKey = String(year);
    const counter = await this.prisma.technicalInspectionCounter.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', yearlyCounters: { [yearKey]: 1 } },
      update: {}, // read-modify-write below
    });

    const currentJson = (counter.yearlyCounters as Record<string, number>) ?? {};
    const currentCount = currentJson[yearKey] ?? 0;
    const nextCount = currentCount + 1;

    await this.prisma.technicalInspectionCounter.update({
      where: { id: 'singleton' },
      data: { yearlyCounters: { ...currentJson, [yearKey]: nextCount } },
    });

    return `INSP-${yearKey}-${String(nextCount).padStart(4, '0')}`;
  }
}
