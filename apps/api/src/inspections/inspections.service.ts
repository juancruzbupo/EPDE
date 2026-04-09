import { computeRiskScore, recurrenceTypeToMonths, TaskPriority, TaskStatus } from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type InspectionItemStatus, type PropertySector } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly repository: InspectionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: {
    propertyId: string;
    inspectedBy: string;
    notes?: string;
    items: {
      sector: PropertySector;
      name: string;
      description?: string;
      status?: InspectionItemStatus;
      finding?: string;
      photoUrl?: string;
      taskTemplateId?: string;
      isCustom?: boolean;
      order?: number;
    }[];
  }) {
    return this.repository.create(data);
  }

  async findByProperty(propertyId: string, userId?: string) {
    if (userId) await this.verifyPropertyOwnership(propertyId, userId);
    return this.repository.findByProperty(propertyId);
  }

  async findById(id: string, userId?: string) {
    const checklist = await this.repository.findById(id);
    if (!checklist) throw new NotFoundException('Inspección no encontrada');
    if (userId) await this.verifyPropertyOwnership(checklist.propertyId, userId);
    return checklist;
  }

  async updateItem(
    itemId: string,
    data: { status?: InspectionItemStatus; finding?: string; photoUrl?: string },
  ) {
    await this.verifyItemAccess(itemId);
    return this.repository.updateItem(itemId, data);
  }

  async addItem(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    await this.verifyChecklistAccess(checklistId);
    return this.repository.addItem(checklistId, data);
  }

  async updateNotes(checklistId: string, notes: string) {
    await this.verifyChecklistAccess(checklistId);
    return this.repository.updateNotes(checklistId, notes);
  }

  async remove(id: string) {
    await this.verifyChecklistAccess(id);
    return this.repository.softDelete(id);
  }

  // ─── Inspection from templates ────────────────────────

  /** Generate inspection items from TaskTemplates filtered by property's activeSectors. */
  async generateItemsFromTemplates(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId, deletedAt: null },
      select: { activeSectors: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    const templates = await this.prisma.categoryTemplate.findMany({
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });

    const sectors = new Set(property.activeSectors);
    const grouped = new Map<
      PropertySector,
      { taskTemplateId: string; name: string; description: string | null }[]
    >();

    for (const cat of templates) {
      for (const tpl of cat.tasks) {
        if (!tpl.defaultSector || !sectors.has(tpl.defaultSector)) continue;
        const sector = tpl.defaultSector as PropertySector;
        const list = grouped.get(sector) ?? [];
        list.push({
          taskTemplateId: tpl.id,
          name: tpl.name,
          description: tpl.technicalDescription,
        });
        grouped.set(sector, list);
      }
    }

    return [...grouped.entries()].map(([sector, items]) => ({ sector, items }));
  }

  // ─── Plan generation from inspection ──────────────────

  /** Create a MaintenancePlan + Tasks from a completed inspection checklist. */
  async generatePlanFromInspection(checklistId: string, planName: string, createdBy: string) {
    const checklist = await this.prisma.inspectionChecklist.findUnique({
      where: { id: checklistId, deletedAt: null },
      include: { items: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
    });
    if (!checklist) throw new NotFoundException('Inspección no encontrada');

    // All items must be evaluated
    const pendingItems = checklist.items.filter((i) => i.status === 'PENDING');
    if (pendingItems.length > 0) {
      throw new BadRequestException(
        `Quedan ${pendingItems.length} items sin evaluar. Completá la inspección antes de generar el plan.`,
      );
    }

    // Property must not already have a plan
    const existingPlan = await this.prisma.maintenancePlan.findUnique({
      where: { propertyId: checklist.propertyId },
    });
    if (existingPlan) {
      throw new ConflictException('Esta propiedad ya tiene un plan de mantenimiento');
    }

    // Fetch all referenced task templates with their category info
    const templateIds = checklist.items
      .map((i) => i.taskTemplateId)
      .filter((id): id is string => id !== null);

    const taskTemplates =
      templateIds.length > 0
        ? await this.prisma.taskTemplate.findMany({
            where: { id: { in: templateIds } },
            include: { category: true },
          })
        : [];
    const templateMap = new Map(taskTemplates.map((t) => [t.id, t]));

    return this.prisma.$transaction(
      async (tx) => {
        // Find-or-create categories
        const categoryMap = new Map<string, string>(); // categoryTemplateId → categoryId
        for (const tpl of taskTemplates) {
          if (categoryMap.has(tpl.categoryId)) continue;
          let category = await tx.category.findFirst({
            where: { categoryTemplateId: tpl.categoryId, deletedAt: null },
          });
          if (!category) {
            category = await tx.category.create({
              data: {
                name: tpl.category.name,
                icon: tpl.category.icon,
                description: tpl.category.description,
                categoryTemplateId: tpl.categoryId,
              },
            });
          }
          categoryMap.set(tpl.categoryId, category.id);
        }

        // Create a fallback "Observaciones" category for custom items
        let observacionesCategoryId: string | null = null;

        // Create the plan
        const plan = await tx.maintenancePlan.create({
          data: {
            propertyId: checklist.propertyId,
            name: planName,
            status: 'DRAFT',
            sourceInspectionId: checklistId,
            createdBy,
          },
        });

        // Create tasks from items and link them back
        for (let i = 0; i < checklist.items.length; i++) {
          const item = checklist.items[i]!;
          const tpl = item.taskTemplateId ? templateMap.get(item.taskTemplateId) : null;

          // Determine category
          let categoryId: string;
          if (tpl) {
            categoryId = categoryMap.get(tpl.categoryId)!;
          } else {
            // Custom item — use "Observaciones" category
            if (!observacionesCategoryId) {
              let obs = await tx.category.findFirst({
                where: { name: 'Observaciones', deletedAt: null },
              });
              if (!obs) {
                obs = await tx.category.create({
                  data: {
                    name: 'Observaciones',
                    icon: '📋',
                    description: 'Items de inspección personalizados',
                  },
                });
              }
              observacionesCategoryId = obs.id;
            }
            categoryId = observacionesCategoryId;
          }

          // Priority adjustment based on inspection status
          let priority = tpl?.priority ?? TaskPriority.MEDIUM;
          let professionalRequirement = tpl?.professionalRequirement ?? 'OWNER_CAN_DO';

          if (item.status === 'NEEDS_ATTENTION') {
            const priorities = [
              TaskPriority.LOW,
              TaskPriority.MEDIUM,
              TaskPriority.HIGH,
              TaskPriority.URGENT,
            ];
            const currentIdx = priorities.indexOf(priority as TaskPriority);
            const highIdx = priorities.indexOf(TaskPriority.HIGH);
            if (currentIdx < highIdx) priority = TaskPriority.HIGH;
          } else if (item.status === 'NEEDS_PROFESSIONAL') {
            priority = TaskPriority.URGENT;
            professionalRequirement = 'PROFESSIONAL_REQUIRED';
          }

          const recurrenceType = tpl?.recurrenceType ?? 'ANNUAL';
          const recurrenceMonths =
            tpl?.recurrenceMonths ?? recurrenceTypeToMonths(recurrenceType) ?? 12;

          const riskScore = computeRiskScore(priority, item.status, item.sector);

          const task = await tx.task.create({
            data: {
              maintenancePlanId: plan.id,
              categoryId,
              sector: item.sector,
              name: item.name,
              description: tpl?.technicalDescription ?? item.description,
              priority,
              professionalRequirement,
              taskType: tpl?.taskType ?? 'INSPECTION',
              recurrenceType,
              recurrenceMonths,
              estimatedDurationMinutes: tpl?.estimatedDurationMinutes,
              inspectionFinding: item.finding,
              inspectionPhotoUrl: item.photoUrl,
              riskScore,
              order: i,
              status: TaskStatus.PENDING,
              createdBy,
            },
          });

          // Link the inspection item to the created task
          await tx.inspectionItem.update({
            where: { id: item.id },
            data: { taskId: task.id },
          });

          // Create baseline TaskLog from inspection — feeds ISV from day 1
          const conditionMap = {
            OK: 'GOOD',
            NEEDS_ATTENTION: 'FAIR',
            NEEDS_PROFESSIONAL: 'POOR',
          } as const;
          const resultMap = {
            OK: 'OK',
            NEEDS_ATTENTION: 'OK_WITH_OBSERVATIONS',
            NEEDS_PROFESSIONAL: 'NEEDS_REPAIR',
          } as const;

          await tx.taskLog.create({
            data: {
              taskId: task.id,
              completedAt: checklist.inspectedAt,
              completedBy: createdBy,
              conditionFound: conditionMap[item.status as keyof typeof conditionMap] ?? 'GOOD',
              result: resultMap[item.status as keyof typeof resultMap] ?? 'OK',
              executor: 'EPDE_PROFESSIONAL',
              actionTaken: 'INSPECTION_ONLY',
              notes: item.finding,
              photoUrl: item.photoUrl,
            },
          });
        }

        return tx.maintenancePlan.findUnique({
          where: { id: plan.id },
          include: { tasks: { orderBy: { order: 'asc' } } },
        });
      },
      { timeout: 15_000 },
    );
  }

  // ─── Ownership validation ─────────────────────────────

  private async verifyPropertyOwnership(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    if (property.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }
  }

  private async verifyChecklistAccess(checklistId: string) {
    const checklist = await this.prisma.inspectionChecklist.findUnique({
      where: { id: checklistId },
      select: { propertyId: true },
    });
    if (!checklist) throw new NotFoundException('Inspección no encontrada');
  }

  private async verifyItemAccess(itemId: string) {
    const item = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
      select: { checklistId: true },
    });
    if (!item) throw new NotFoundException('Item de inspección no encontrado');
  }
}
