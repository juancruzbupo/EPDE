import type {
  CreatePropertyInput,
  PropertyFiltersInput,
  ServiceUser,
  UpdatePropertyInput,
} from '@epde/shared';
import { UserRole } from '@epde/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { ISVSnapshotRepository } from '../dashboard/isv-snapshot.repository';
import { PropertiesRepository } from './properties.repository';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly dashboardRepository: DashboardRepository,
    private readonly isvSnapshotRepository: ISVSnapshotRepository,
  ) {}

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
        this.propertiesRepository.getReportTasks(planId),
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
