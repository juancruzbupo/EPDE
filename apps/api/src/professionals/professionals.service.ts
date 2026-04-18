import type {
  CreateProfessionalInput,
  ProfessionalFiltersInput,
  ProfessionalPublic,
  ProfessionalSpecialty,
  SuggestedProfessionalsQuery,
  UpdateAvailabilityInput,
  UpdateProfessionalInput,
  UpdateTierInput,
} from '@epde/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Professional, ProfessionalAttachmentType } from '@prisma/client';

import { ProfessionalsRepository } from './professionals.repository';

type ProfessionalWithIncludes = Professional & {
  specialties: Array<{ specialty: string; isPrimary: boolean }>;
  tags: Array<{ tag: string }>;
};

@Injectable()
export class ProfessionalsService {
  constructor(private readonly repo: ProfessionalsRepository) {}

  async list(filters: ProfessionalFiltersInput) {
    const result = await this.repo.findManyWithInclude({
      cursor: filters.cursor,
      take: filters.take,
      search: filters.search,
      specialty: filters.specialty,
      tier: filters.tier ? { equals: filters.tier } : undefined,
      availability: filters.availability ? { equals: filters.availability } : undefined,
      serviceArea: filters.serviceArea,
    });

    const dataWithStats = await Promise.all(
      result.data.map(async (p) => this.toPublic(p as ProfessionalWithIncludes)),
    );

    return {
      data: dataWithStats,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    };
  }

  async get(id: string) {
    const professional = await this.repo.findDetailById(id);
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    const stats = await this.repo.computeStats(id);
    return {
      ...this.toPublic(professional as ProfessionalWithIncludes, stats),
      attachments: professional.attachments.map((a) => ({
        id: a.id,
        type: a.type,
        url: a.url,
        fileName: a.fileName,
        expiresAt: a.expiresAt?.toISOString() ?? null,
        verifiedAt: a.verifiedAt?.toISOString() ?? null,
        verifiedBy: a.verifiedBy,
        createdAt: a.createdAt.toISOString(),
      })),
      ratings: professional.ratings.map((r) => ({
        id: r.id,
        authorId: r.authorId,
        authorName: null,
        serviceRequestId: r.serviceRequestId,
        score: r.score,
        punctuality: r.punctuality,
        quality: r.quality,
        priceValue: r.priceValue,
        adminComment: r.adminComment,
        clientComment: r.clientComment,
        createdAt: r.createdAt.toISOString(),
      })),
      timelineNotes: professional.timelineNotes.map((n) => ({
        id: n.id,
        authorId: n.authorId,
        authorName: null,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async create(dto: CreateProfessionalInput, createdBy: string) {
    const created = await this.repo.createWithSpecialties({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      photoUrl: dto.photoUrl ?? null,
      bio: dto.bio ?? null,
      registrationNumber: dto.registrationNumber,
      registrationBody: dto.registrationBody,
      serviceAreas: dto.serviceAreas,
      yearsOfExperience: dto.yearsOfExperience ?? null,
      hourlyRateMin: dto.hourlyRateMin ?? null,
      hourlyRateMax: dto.hourlyRateMax ?? null,
      notes: dto.notes ?? null,
      createdBy,
      specialties: dto.specialties,
    });
    return this.toPublic(created as ProfessionalWithIncludes);
  }

  async update(id: string, dto: UpdateProfessionalInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Profesional no encontrado');

    const { specialties, ...rest } = dto;
    await this.repo.update(id, rest as never);

    if (specialties) {
      await this.repo.updateSpecialties(id, specialties);
    }

    return this.get(id);
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Profesional no encontrado');
    await this.repo.softDelete(id);
  }

  async updateTier(id: string, dto: UpdateTierInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Profesional no encontrado');

    if (dto.tier === 'BLOCKED' && !dto.blockedReason) {
      throw new BadRequestException('Razón obligatoria al bloquear');
    }

    await this.repo.update(id, {
      tier: dto.tier,
      blockedReason: dto.tier === 'BLOCKED' ? (dto.blockedReason ?? null) : null,
    } as never);

    return this.get(id);
  }

  async updateAvailability(id: string, dto: UpdateAvailabilityInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Profesional no encontrado');

    await this.repo.update(id, {
      availability: dto.availability,
      availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
    } as never);

    return this.get(id);
  }

  /**
   * Top N professionals sorted by: tier (A>B>C), bayesian rating avg,
   * then lastAssignedAt descending to rotate against fatigue.
   */
  async getSuggested(query: SuggestedProfessionalsQuery) {
    const candidates = await this.repo.findSuggested(
      query.specialty as ProfessionalSpecialty,
      query.serviceArea,
      query.limit,
    );

    const withStats = await Promise.all(
      candidates.map(async (p) => {
        const stats = await this.repo.computeStats(p.id);
        return { pro: p as ProfessionalWithIncludes, stats };
      }),
    );

    const tierWeight: Record<string, number> = { A: 0, B: 1, C: 2, BLOCKED: 9 };
    withStats.sort((a, b) => {
      const tierDiff = (tierWeight[a.pro.tier] ?? 9) - (tierWeight[b.pro.tier] ?? 9);
      if (tierDiff !== 0) return tierDiff;
      const ratingDiff = (b.stats.ratingAvg ?? 0) - (a.stats.ratingAvg ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      const aLast = a.stats.lastAssignedAt?.getTime() ?? 0;
      const bLast = b.stats.lastAssignedAt?.getTime() ?? 0;
      return bLast - aLast;
    });

    return withStats.slice(0, query.limit).map(({ pro, stats }) => ({
      professional: this.toPublic(pro, stats),
      matchReason: this.buildMatchReason(pro, stats),
    }));
  }

  private buildMatchReason(
    p: ProfessionalWithIncludes,
    stats: Awaited<ReturnType<ProfessionalsRepository['computeStats']>>,
  ): string {
    const parts: string[] = [`tier ${p.tier}`];
    if (stats.ratingAvg !== null) {
      parts.push(`rating ${stats.ratingAvg.toFixed(1)} (${stats.ratingCount})`);
    }
    if (stats.completedAssignments > 0) {
      parts.push(`${stats.completedAssignments} trabajos completados`);
    }
    if (stats.activeAssignments > 0) {
      parts.push(`${stats.activeAssignments} activos`);
    }
    return parts.join(' · ');
  }

  private toPublic(
    p: ProfessionalWithIncludes,
    stats?: Awaited<ReturnType<ProfessionalsRepository['computeStats']>>,
  ): ProfessionalPublic {
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      photoUrl: p.photoUrl,
      bio: p.bio,
      registrationNumber: p.registrationNumber,
      registrationBody: p.registrationBody,
      serviceAreas: p.serviceAreas,
      yearsOfExperience: p.yearsOfExperience,
      hourlyRateMin: p.hourlyRateMin === null ? null : Number(p.hourlyRateMin),
      hourlyRateMax: p.hourlyRateMax === null ? null : Number(p.hourlyRateMax),
      availability: p.availability,
      availableUntil: p.availableUntil?.toISOString() ?? null,
      tier: p.tier,
      blockedReason: p.blockedReason,
      notes: p.notes,
      specialties: p.specialties.map((s) => ({
        specialty: s.specialty as never,
        isPrimary: s.isPrimary,
      })),
      tags: p.tags.map((t) => t.tag),
      stats: stats
        ? {
            ...stats,
            lastAssignedAt: stats.lastAssignedAt?.toISOString() ?? null,
          }
        : {
            ratingAvg: null,
            ratingCount: 0,
            completedAssignments: 0,
            activeAssignments: 0,
            totalPaid: 0,
            pendingPayments: 0,
            lastAssignedAt: null,
          },
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

export { type ProfessionalAttachmentType };
