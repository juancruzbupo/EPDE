import type {
  CreateTechnicalInspectionInput,
  MarkInspectionPaidInput,
  ScheduleInspectionInput,
  ServiceUser,
  TechnicalInspectionFiltersInput,
  TechnicalInspectionPublic,
  UpdateInspectionStatusInput,
  UploadDeliverableInput,
} from '@epde/shared';
import { TECHNICAL_INSPECTION_PRICES, UserRole } from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, TechnicalInspection } from '@prisma/client';

import { PropertiesRepository } from '../properties/properties.repository';
import { UsersRepository } from '../users/users.repository';
import { TechnicalInspectionsRepository } from './technical-inspections.repository';

type InspectionWithIncludes = TechnicalInspection & {
  property: { id: string; address: string; city: string; userId: string } | null;
  requester: { id: string; name: string; email: string } | null;
};

@Injectable()
export class TechnicalInspectionsService {
  constructor(
    private readonly repo: TechnicalInspectionsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async list(filters: TechnicalInspectionFiltersInput, currentUser: ServiceUser) {
    const result = await this.repo.findManyWithFilters({
      cursor: filters.cursor,
      take: filters.take,
      status: filters.status,
      type: filters.type,
      propertyId: filters.propertyId,
      feeStatus: filters.feeStatus,
      // CLIENT sees only their own; ADMIN sees all
      requestedBy: currentUser.role === UserRole.CLIENT ? currentUser.id : undefined,
    });

    return {
      data: result.data.map((i) => this.toPublic(i as InspectionWithIncludes)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    };
  }

  async get(id: string, currentUser: ServiceUser) {
    const inspection = await this.repo.findByIdWithIncludes(id);
    if (!inspection) throw new NotFoundException('Inspección no encontrada');

    this.assertAccess(inspection as InspectionWithIncludes, currentUser);
    return this.toPublic(inspection as InspectionWithIncludes);
  }

  async create(dto: CreateTechnicalInspectionInput, currentUser: ServiceUser) {
    if (currentUser.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Solo clientes pueden solicitar inspecciones técnicas');
    }

    // Must be an active-subscription client
    const user = await this.usersRepository.findById(currentUser.id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const hasActivePlan =
      !user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date();

    if (!hasActivePlan) {
      throw new ForbiddenException(
        'La inspección técnica es un servicio exclusivo para clientes con plan EPDE activo. Renová tu suscripción para solicitarla.',
      );
    }

    // Verify property ownership
    const property = await this.propertiesRepository.findById(dto.propertyId);
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    if (property.userId !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a esta propiedad');
    }

    // Freeze price at request time (client price since they're active)
    const priceConfig = TECHNICAL_INSPECTION_PRICES[dto.type];
    const feeAmount = hasActivePlan ? priceConfig.client : priceConfig.public;

    // Generate sequential inspection number
    const year = new Date().getFullYear();
    const inspectionNumber = await this.repo.getNextInspectionNumber(year);

    const created = await this.repo.createWithInclude({
      inspectionNumber,
      propertyId: dto.propertyId,
      requestedBy: currentUser.id,
      type: dto.type,
      clientNotes: dto.clientNotes ?? null,
      feeAmount,
      hadActivePlan: hasActivePlan,
    });

    return this.toPublic(created as InspectionWithIncludes);
  }

  async schedule(id: string, dto: ScheduleInspectionInput, _adminId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Inspección no encontrada');

    if (existing.status !== 'REQUESTED' && existing.status !== 'SCHEDULED') {
      throw new ConflictException(
        `No se puede agendar una inspección en estado ${existing.status}`,
      );
    }

    const updated = await this.repo.updateWithInclude(id, {
      status: 'SCHEDULED',
      scheduledFor: new Date(dto.scheduledFor),
      adminNotes: dto.adminNotes ?? existing.adminNotes,
    });

    return this.toPublic(updated as InspectionWithIncludes);
  }

  async updateStatus(id: string, dto: UpdateInspectionStatusInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Inspección no encontrada');

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      REQUESTED: ['SCHEDULED', 'CANCELED'],
      SCHEDULED: ['IN_PROGRESS', 'CANCELED'],
      IN_PROGRESS: ['REPORT_READY', 'CANCELED'],
      REPORT_READY: ['PAID', 'CANCELED'],
      PAID: [], // terminal
      CANCELED: [], // terminal
    };

    const allowed = validTransitions[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new ConflictException(
        `Transición inválida: ${existing.status} → ${dto.status}. Permitidas: ${allowed.join(', ') || 'ninguna (terminal)'}`,
      );
    }

    const data: Prisma.TechnicalInspectionUpdateInput = {
      status: dto.status,
      adminNotes: dto.adminNotes ?? existing.adminNotes,
    };

    if (dto.status === 'IN_PROGRESS' && !existing.completedAt) {
      // optional: mark inspection visit done
    }
    if (dto.status === 'REPORT_READY') data.completedAt = new Date();

    const updated = await this.repo.updateWithInclude(id, data);
    return this.toPublic(updated as InspectionWithIncludes);
  }

  async uploadDeliverable(id: string, dto: UploadDeliverableInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Inspección no encontrada');

    if (existing.status === 'CANCELED' || existing.status === 'PAID') {
      throw new ConflictException('No se puede subir deliverable en este estado');
    }

    const updated = await this.repo.updateWithInclude(id, {
      deliverableUrl: dto.deliverableUrl,
      deliverableFileName: dto.deliverableFileName,
      // Auto-transition to REPORT_READY when deliverable is uploaded
      status: 'REPORT_READY',
      completedAt: existing.completedAt ?? new Date(),
    });

    return this.toPublic(updated as InspectionWithIncludes);
  }

  async markPaid(id: string, dto: MarkInspectionPaidInput) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Inspección no encontrada');

    if (existing.status !== 'REPORT_READY') {
      throw new ConflictException(
        'Solo se puede marcar como pagada una inspección con informe listo',
      );
    }
    if (!existing.deliverableUrl) {
      throw new BadRequestException('Falta subir el informe deliverable antes de marcar pagada');
    }

    const updated = await this.repo.updateWithInclude(id, {
      status: 'PAID',
      feeStatus: 'PAID',
      paidAt: new Date(),
      paymentMethod: dto.paymentMethod,
      paymentReceiptUrl: dto.paymentReceiptUrl ?? null,
    });

    return this.toPublic(updated as InspectionWithIncludes);
  }

  async cancel(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Inspección no encontrada');

    if (existing.status === 'PAID') {
      throw new ConflictException('No se puede cancelar una inspección ya pagada');
    }

    await this.repo.softDelete(id);
  }

  private assertAccess(inspection: InspectionWithIncludes, currentUser: ServiceUser) {
    if (currentUser.role === UserRole.ADMIN) return;
    if (inspection.requestedBy !== currentUser.id) {
      throw new ForbiddenException('Acceso denegado a esta inspección');
    }
  }

  private toPublic(i: InspectionWithIncludes): TechnicalInspectionPublic {
    return {
      id: i.id,
      inspectionNumber: i.inspectionNumber,
      propertyId: i.propertyId,
      property: i.property
        ? { id: i.property.id, address: i.property.address, city: i.property.city }
        : undefined,
      requestedBy: i.requestedBy,
      requester: i.requester
        ? { id: i.requester.id, name: i.requester.name, email: i.requester.email }
        : undefined,
      type: i.type,
      status: i.status,
      clientNotes: i.clientNotes,
      adminNotes: i.adminNotes,
      scheduledFor: i.scheduledFor?.toISOString() ?? null,
      completedAt: i.completedAt?.toISOString() ?? null,
      deliverableUrl: i.deliverableUrl,
      deliverableFileName: i.deliverableFileName,
      feeAmount: Number(i.feeAmount),
      feeStatus: i.feeStatus,
      hadActivePlan: i.hadActivePlan,
      paidAt: i.paidAt?.toISOString() ?? null,
      paymentMethod: i.paymentMethod,
      paymentReceiptUrl: i.paymentReceiptUrl,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }
}
