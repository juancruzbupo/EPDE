import { Injectable } from '@nestjs/common';
import type { Prisma, Professional, ProfessionalSpecialty } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

const PROFESSIONAL_INCLUDE = {
  specialties: true,
  tags: true,
} as const;

const PROFESSIONAL_DETAIL_INCLUDE = {
  specialties: true,
  tags: true,
  attachments: { orderBy: { createdAt: 'desc' } },
  ratings: { orderBy: { createdAt: 'desc' }, take: 100 },
  timelineNotes: { orderBy: { createdAt: 'desc' }, take: 100 },
} as const;

@Injectable()
export class ProfessionalsRepository extends BaseRepository<
  Professional,
  'professional',
  Prisma.ProfessionalCreateInput,
  Prisma.ProfessionalUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'professional', true);
  }

  async findManyWithInclude(filters: {
    cursor?: string;
    take: number;
    search?: string;
    specialty?: ProfessionalSpecialty;
    tier?: Prisma.EnumProfessionalTierFilter;
    availability?: Prisma.EnumProfessionalAvailabilityFilter;
    serviceArea?: string;
  }) {
    const where: Prisma.ProfessionalWhereInput = { deletedAt: null };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.specialty) {
      where.specialties = { some: { specialty: filters.specialty } };
    }
    if (filters.tier) where.tier = filters.tier;
    if (filters.availability) where.availability = filters.availability;
    if (filters.serviceArea) where.serviceAreas = { has: filters.serviceArea };

    const take = Math.min(Math.max(filters.take, 1), 100);

    const [total, rows] = await Promise.all([
      this.prisma.professional.count({ where }),
      this.prisma.professional.findMany({
        where,
        include: PROFESSIONAL_INCLUDE,
        orderBy: [{ tier: 'asc' }, { createdAt: 'desc' }],
        take: take + 1,
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      }),
    ]);

    const hasMore = rows.length > take;
    const data = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor, hasMore, total };
  }

  async findDetailById(id: string) {
    return this.prisma.professional.findFirst({
      where: { id, deletedAt: null },
      include: PROFESSIONAL_DETAIL_INCLUDE,
    });
  }

  async createWithSpecialties(
    dto: Prisma.ProfessionalCreateInput & {
      specialties: Array<{ specialty: ProfessionalSpecialty; isPrimary: boolean }>;
    },
  ) {
    const { specialties, ...data } = dto;
    return this.prisma.professional.create({
      data: {
        ...data,
        specialties: { create: specialties },
      },
      include: PROFESSIONAL_INCLUDE,
    });
  }

  async updateSpecialties(
    id: string,
    specialties: Array<{ specialty: ProfessionalSpecialty; isPrimary: boolean }>,
  ) {
    await this.prisma.$transaction([
      this.prisma.professionalSpecialtyAssignment.deleteMany({ where: { professionalId: id } }),
      this.prisma.professionalSpecialtyAssignment.createMany({
        data: specialties.map((s) => ({ ...s, professionalId: id })),
      }),
    ]);
  }

  /**
   * Smart match: top N professionals for a (specialty, serviceArea) combo.
   * Filters out BLOCKED tier and expired matrícula. Orders by tier (A first),
   * then by rating descending (computed in service layer), then lastAssignedAt
   * descending (freshest first as tie-breaker for anti-fatigue rotation).
   */
  async findSuggested(
    specialty: ProfessionalSpecialty,
    serviceArea: string | undefined,
    limit: number,
  ) {
    const now = new Date();
    return this.prisma.professional.findMany({
      where: {
        deletedAt: null,
        tier: { not: 'BLOCKED' },
        availability: { not: 'UNAVAILABLE' },
        specialties: { some: { specialty } },
        ...(serviceArea ? { serviceAreas: { has: serviceArea } } : {}),
        attachments: {
          some: {
            type: 'MATRICULA',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
      include: {
        specialties: true,
        tags: true,
        assignments: { orderBy: { assignedAt: 'desc' }, take: 1 },
      },
      orderBy: [{ tier: 'asc' }, { updatedAt: 'desc' }],
      take: limit * 3, // over-fetch; service layer refines with bayesian rating
    });
  }

  async computeStats(id: string) {
    const [ratings, completedAssignments, activeAssignments, paymentAgg, lastAssignment] =
      await Promise.all([
        this.prisma.professionalRating.findMany({
          where: { professionalId: id },
          select: { score: true },
        }),
        this.prisma.serviceRequestAssignment.count({
          where: {
            professionalId: id,
            serviceRequest: { status: { in: ['RESOLVED', 'CLOSED'] } },
          },
        }),
        this.prisma.serviceRequestAssignment.count({
          where: {
            professionalId: id,
            serviceRequest: { status: { in: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] } },
          },
        }),
        this.prisma.professionalPayment.groupBy({
          by: ['status'],
          where: { professionalId: id },
          _sum: { amount: true },
        }),
        this.prisma.serviceRequestAssignment.findFirst({
          where: { professionalId: id },
          orderBy: { assignedAt: 'desc' },
          select: { assignedAt: true },
        }),
      ]);

    // Bayesian smoothing: prior mean m=3.5, pseudocount C=5.
    const count = ratings.length;
    const rawSum = ratings.reduce((sum, r) => sum + r.score, 0);
    const ratingAvg = count === 0 ? null : (rawSum + 3.5 * 5) / (count + 5);

    const totalPaid = Number(paymentAgg.find((p) => p.status === 'PAID')?._sum.amount ?? 0);
    const pendingPayments = Number(
      paymentAgg.find((p) => p.status === 'PENDING')?._sum.amount ?? 0,
    );

    return {
      ratingAvg,
      ratingCount: count,
      completedAssignments,
      activeAssignments,
      totalPaid,
      pendingPayments,
      lastAssignedAt: lastAssignment?.assignedAt ?? null,
    };
  }
}
