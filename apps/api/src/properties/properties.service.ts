import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesRepository } from './properties.repository';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFiltersDto } from './dto/property-filters.dto';

interface CurrentUser {
  id: string;
  role: string;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listProperties(filters: PropertyFiltersDto, currentUser: CurrentUser) {
    const userId = currentUser.role === 'CLIENT' ? currentUser.id : filters.userId;

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

    if (currentUser.role === 'CLIENT' && property.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    return property;
  }

  async createProperty(dto: CreatePropertyDto) {
    return this.prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          userId: dto.userId,
          address: dto.address,
          city: dto.city,
          type:
            (dto.type as 'HOUSE' | 'APARTMENT' | 'DUPLEX' | 'COUNTRY_HOUSE' | 'OTHER') ?? 'HOUSE',
          yearBuilt: dto.yearBuilt,
          squareMeters: dto.squareMeters,
        },
      });

      await tx.maintenancePlan.create({
        data: {
          propertyId: property.id,
          name: `Plan de Mantenimiento — ${property.address}`,
          status: 'DRAFT',
        },
      });

      return tx.property.findUnique({
        where: { id: property.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          maintenancePlan: true,
        },
      });
    });
  }

  async updateProperty(id: string, dto: UpdatePropertyDto, currentUser: CurrentUser) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    if (currentUser.role === 'CLIENT' && property.userId !== currentUser.id) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }

    return this.propertiesRepository.update(id, dto);
  }

  async deleteProperty(id: string) {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    await this.propertiesRepository.softDelete(id);
    return { message: 'Propiedad eliminada' };
  }
}
