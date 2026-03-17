import type {
  CreatePropertyInput,
  PropertyFiltersInput,
  ServiceUser,
  UpdatePropertyInput,
} from '@epde/shared';
import { UserRole } from '@epde/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PropertyAccessDeniedError } from '../common/exceptions/domain.exceptions';
import { DashboardRepository } from '../dashboard/dashboard.repository';
import { PropertiesRepository } from './properties.repository';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async listProperties(filters: PropertyFiltersInput, currentUser: ServiceUser) {
    const userId = currentUser.role === UserRole.CLIENT ? currentUser.id : filters.userId;

    return this.propertiesRepository.findProperties({
      cursor: filters.cursor,
      take: filters.take,
      search: filters.search,
      userId,
      city: filters.city,
      type: filters.type,
    });
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
    return { data: null, message: 'Propiedad eliminada' };
  }

  async getPropertyPhotos(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    const photos = await this.propertiesRepository.getPropertyPhotos(id);
    return { data: photos };
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
        data: {
          score: 0,
          label: 'Sin plan',
          dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
          sectorScores: [],
        },
      };
    }

    const index = await this.dashboardRepository.getPropertyHealthIndex([planId]);
    return { data: index };
  }

  async getPropertyExpenses(id: string, currentUser: ServiceUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    this.assertOwnership(property.userId, currentUser);

    const expenses = await this.propertiesRepository.getPropertyExpenses(id);
    return { data: expenses };
  }

  private assertOwnership(propertyUserId: string, currentUser: ServiceUser) {
    try {
      if (currentUser.role === UserRole.CLIENT && propertyUserId !== currentUser.id) {
        throw new PropertyAccessDeniedError();
      }
    } catch (error) {
      if (error instanceof PropertyAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
