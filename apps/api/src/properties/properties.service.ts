import type {
  CreatePropertyInput,
  PropertyFiltersInput,
  ServiceUser,
  UpdatePropertyInput,
} from '@epde/shared';
import { UserRole } from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { DashboardRepository } from '../dashboard/dashboard.repository';
import { ISVSnapshotRepository } from '../dashboard/isv-snapshot.repository';
import { RedisService } from '../redis/redis.service';
import { PropertiesRepository } from './properties.repository';

/** Short TTL for the plan report task list. Tolerates up to 60s of staleness
 *  in exchange for collapsing repeated report fetches (list views, refresh storms). */
const REPORT_TASKS_TTL = 60;

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly dashboardRepository: DashboardRepository,
    private readonly isvSnapshotRepository: ISVSnapshotRepository,
    private readonly redis: RedisService,
    private readonly userLookup: UserLookupRepository,
  ) {}

  private async getCachedReportTasks(planId: string) {
    const cacheKey = `report-tasks:${planId}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached)
        return JSON.parse(cached) as Awaited<
          ReturnType<typeof this.propertiesRepository.getReportTasks>
        >;
    } catch {
      // Redis unavailable — fall through to DB
    }
    const fresh = await this.propertiesRepository.getReportTasks(planId);
    try {
      await this.redis.setex(cacheKey, REPORT_TASKS_TTL, JSON.stringify(fresh));
    } catch {
      // Cache write failed — still return data
    }
    return fresh;
  }

  async listProperties(filters: PropertyFiltersInput, currentUser: ServiceUser) {
    const userId = currentUser.role === UserRole.CLIENT ? currentUser.id : filters.userId;

    const result = await this.propertiesRepository.findProperties({
      cursor: filters.cursor,
      take: filters.take,
      search: filters.search,
      userId,
      city: filters.city,
      type: filters.type,
    });

    // Enrich with real-time ISV scores — batch calculation (3 queries total, not 3×N)
    const planIdToPropertyId = new Map<string, string>();
    for (const p of result.data) {
      const plan = (p as Record<string, unknown>).maintenancePlan as { id: string } | null;
      if (plan) planIdToPropertyId.set(plan.id, p.id);
    }
    const batchResults = await this.dashboardRepository.getPropertyHealthIndexBatch([
      ...planIdToPropertyId.keys(),
    ]);
    const isvMap = new Map<string, { score: number; label: string }>();
    for (const [planId, propertyId] of planIdToPropertyId) {
      const health = batchResults.get(planId);
      if (health) isvMap.set(propertyId, health);
    }

    return {
      ...result,
      data: result.data.map((p) => ({
        ...p,
        latestISV: isvMap.get(p.id) ?? null,
      })),
    };
  }

  async getProperty(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findWithPlan(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    return property;
  }

  async createProperty(dto: CreatePropertyInput, createdBy?: string) {
    return this.propertiesRepository.createWithPlan({
      userId: dto.userId,
      address: dto.address,
      city: dto.city,
      type: dto.type,
      yearBuilt: dto.yearBuilt,
      squareMeters: dto.squareMeters,
      createdBy,
    });
  }

  async updateProperty(id: string, dto: UpdatePropertyInput, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    return this.propertiesRepository.update(id, { ...dto, updatedBy: currentUser.id });
  }

  async deleteProperty(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    await this.propertiesRepository.softDeleteWithCascade(id);
  }

  async getCertificateData(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findWithPlan(id);
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    this.assertOwnership(property.userId, currentUser);

    const plan = property.maintenancePlan;
    if (!plan) throw new BadRequestException('La propiedad no tiene plan de mantenimiento');

    const planId = plan.id;
    const planCreatedAt = new Date(plan.createdAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (planCreatedAt > oneYearAgo) {
      const eligibleDate = new Date(planCreatedAt);
      eligibleDate.setFullYear(eligibleDate.getFullYear() + 1);
      throw new BadRequestException(
        `El certificado requiere al menos 1 año de uso de la herramienta. ` +
          `Disponible a partir del ${eligibleDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
      );
    }

    const [healthBatch, isvHistory, adminInfo] = await Promise.all([
      this.dashboardRepository.getPropertyHealthIndexBatch([planId]),
      this.isvSnapshotRepository.findByProperty(id),
      this.userLookup.findEmailInfo(currentUser.id),
    ]);

    const healthIndex = healthBatch.get(planId);
    if (!healthIndex || healthIndex.score < 60) {
      throw new BadRequestException(
        'El certificado requiere un Índice de Salud (ISV) de al menos 60. ISV actual: ' +
          (healthIndex?.score ?? 0),
      );
    }

    const [stats, highlights, cert] = await Promise.all([
      this.propertiesRepository.getCertificateStats(planId),
      this.propertiesRepository.getCertificateHighlights(planId),
      this.propertiesRepository.issueCertificate({
        propertyId: id,
        issuedBy: currentUser.id,
        healthIndexScore: healthIndex.score,
      }),
    ]);

    const firstSnapshot = isvHistory.length > 0 ? isvHistory[isvHistory.length - 1] : null;

    return {
      certificateNumber: cert.formattedNumber,
      issuedAt: new Date().toISOString(),
      coveragePeriod: {
        from: firstSnapshot?.snapshotDate.toISOString() ?? new Date().toISOString(),
        to: new Date().toISOString(),
      },
      property: {
        id: property.id,
        address: property.address,
        city: property.city,
        type: property.type,
        yearBuilt: property.yearBuilt,
        squareMeters: property.squareMeters,
        owner: {
          name: property.user?.name ?? 'Propietario',
          email: property.user?.email ?? '',
        },
      },
      healthIndex,
      isvHistory: isvHistory.slice(0, 12).map((s) => ({
        month: s.snapshotDate.toISOString().slice(0, 7),
        score: s.score,
        label: s.label,
        compliance: s.compliance,
        condition: s.condition,
        coverage: s.coverage,
        investment: s.investment,
        trend: s.trend,
      })),
      summary: {
        ...stats,
        totalSectors: property.activeSectors?.length ?? 9,
      },
      highlights: highlights.map((h) => ({
        taskName: h.task.name,
        categoryName: h.task.category.name,
        sector: h.task.sector,
        completedAt: h.completedAt.toISOString(),
        conditionFound: h.conditionFound,
      })),
      architect: { name: adminInfo?.name ?? 'EPDE' },
    };
  }

  async markContacted(id: string): Promise<void> {
    await this.propertiesRepository.markContacted(id);
  }

  async getPropertyPhotos(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    return this.propertiesRepository.getPropertyPhotos(id);
  }

  async getPropertyHealthIndex(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findWithPlan(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    const planId = property.maintenancePlan?.id;
    if (!planId) {
      return {
        score: 0,
        label: 'Sin plan',
        dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
        sectorScores: [],
      };
    }

    return this.dashboardRepository.getPropertyHealthIndex([planId]);
  }

  async getPropertyHealthHistory(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    const snapshots = await this.isvSnapshotRepository.findByProperty(id, 12);
    const data = snapshots
      .map((s) => ({
        month: s.snapshotDate.toISOString().slice(0, 7),
        score: s.score,
        label: s.label,
        compliance: s.compliance,
        condition: s.condition,
        coverage: s.coverage,
        investment: s.investment,
        trend: s.trend,
      }))
      .reverse();

    return data;
  }

  async getPropertyProblems(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    return this.propertiesRepository.getOpenProblems(id);
  }

  async getPropertyExpenses(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    return this.propertiesRepository.getPropertyExpenses(id);
  }

  async getReportData(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findWithPlan(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    const planId = property.maintenancePlan?.id;

    if (!planId) {
      return {
        property: {
          id: property.id,
          address: property.address,
          city: property.city,
          type: property.type,
          yearBuilt: property.yearBuilt,
          squareMeters: property.squareMeters,
          userId: property.userId,
          user: property.user,
        },
        healthIndex: {
          score: 0,
          label: 'Sin plan',
          dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
          sectorScores: [],
        },
        sectorBreakdown: [],
        categoryBreakdown: [],
        overdueTasks: [],
        upcomingTasks: [],
        recentLogs: [],
        taskStats: { total: 0, overdue: 0, pending: 0, upcoming: 0, completed: 0 },
      };
    }

    const [healthIndex, sectorBreakdown, categoryBreakdown, reportTasks, recentLogs] =
      await Promise.all([
        this.dashboardRepository.getPropertyHealthIndex([planId]),
        this.dashboardRepository.getClientSectorBreakdown([planId]),
        this.dashboardRepository.getClientCategoryBreakdown([planId]),
        this.getCachedReportTasks(planId),
        this.propertiesRepository.getRecentTaskLogs(planId),
      ]);

    return {
      property: {
        id: property.id,
        address: property.address,
        city: property.city,
        type: property.type,
        yearBuilt: property.yearBuilt,
        squareMeters: property.squareMeters,
        userId: property.userId,
        user: property.user,
      },
      healthIndex,
      sectorBreakdown,
      categoryBreakdown,
      overdueTasks: reportTasks.overdue,
      upcomingTasks: reportTasks.upcoming,
      recentLogs,
      taskStats: reportTasks.stats,
    };
  }

  private assertOwnership(propertyUserId: string, currentUser: ServiceUser) {
    if (currentUser.role === UserRole.CLIENT && propertyUserId !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a esta propiedad');
    }
  }
}
