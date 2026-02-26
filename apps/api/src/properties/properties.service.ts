import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesRepository } from './properties.repository';
import { UserRole } from '@epde/shared';
import type { CreatePropertyInput, UpdatePropertyInput, PropertyFiltersInput } from '@epde/shared';

interface CurrentUser {
  id: string;
  role: string;
}

@Injectable()
export class PropertiesService {
  constructor(private readonly propertiesRepository: PropertiesRepository) {}

  async listProperties(filters: PropertyFiltersInput, currentUser: CurrentUser) {
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

  async getProperty(id: string, currentUser: CurrentUser) {
    const property = await this.propertiesRepository.findWithPlan(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (currentUser.role === UserRole.CLIENT && property.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

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

  async updateProperty(id: string, dto: UpdatePropertyInput, currentUser: CurrentUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (currentUser.role === UserRole.CLIENT && property.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    return this.propertiesRepository.update(id, dto);
  }

  async deleteProperty(id: string, currentUser: CurrentUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (currentUser.role === UserRole.CLIENT && property.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    await this.propertiesRepository.softDelete(id);
    return { message: 'Propiedad eliminada' };
  }
}
