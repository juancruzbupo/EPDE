import {
  computeRiskScore,
  recurrenceTypeToMonths,
  suggestDueDate,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type InspectionItemStatus, Prisma, type PropertySector } from '@prisma/client';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { TaskTemplatesRepository } from '../task-templates/task-templates.repository';
import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly repository: InspectionsRepository,
    private readonly taskTemplatesRepository: TaskTemplatesRepository,
    private readonly categoryTemplatesRepository: CategoryTemplatesRepository,
    private readonly propertiesRepository: PropertiesRepository,
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
      inspectionGuide?: string;
      guideImageUrls?: string[];
      isCustom?: boolean;
      order?: number;
    }[];
  }) {
    // Enrich items with guide from templates (if not already provided)
    const templateIds = data.items
      .filter((i) => i.taskTemplateId && !i.inspectionGuide)
      .map((i) => i.taskTemplateId!);

    if (templateIds.length > 0) {
      const templates = await this.taskTemplatesRepository.findByIdsWithGuide(templateIds);
      const tplMap = new Map(templates.map((t) => [t.id, t]));

      for (const item of data.items) {
        if (item.taskTemplateId && !item.inspectionGuide) {
          const tpl = tplMap.get(item.taskTemplateId);
          if (tpl) {
            item.inspectionGuide = tpl.inspectionGuide ?? undefined;
            item.guideImageUrls = tpl.guideImageUrls;
          }
        }
      }
    }

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
    await this.verifyItemAccessAndEditable(itemId);
    return this.repository.updateItem(itemId, data);
  }

  async addItem(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    await this.verifyChecklistAccessAndEditable(checklistId);
    return this.repository.addItem(checklistId, data);
  }

  async updateNotes(checklistId: string, notes: string) {
    await this.verifyChecklistAccessAndEditable(checklistId);
    return this.repository.updateNotes(checklistId, notes);
  }

  async remove(id: string) {
    await this.verifyChecklistAccess(id);
    return this.repository.softDelete(id);
  }

  // ─── Inspection from templates ────────────────────────

  /** Generate inspection items from TaskTemplates filtered by property's activeSectors. */
  async generateItemsFromTemplates(propertyId: string) {
    const activeSectors = await this.propertiesRepository.findActiveSectors(propertyId);
    if (!activeSectors) throw new NotFoundException('Propiedad no encontrada');

    const templates = await this.categoryTemplatesRepository.findAllWithTasks();

    const sectors = new Set(activeSectors);
    const grouped = new Map<
      PropertySector,
      {
        taskTemplateId: string;
        name: string;
        description: string | null;
        inspectionGuide: string | null;
        guideImageUrls: string[];
      }[]
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
          inspectionGuide: tpl.inspectionGuide,
          guideImageUrls: tpl.guideImageUrls,
        });
        grouped.set(sector, list);
      }
    }

    return [...grouped.entries()].map(([sector, items]) => ({ sector, items }));
  }

  // ─── Plan generation from inspection ──────────────────

  /**
   * Create a MaintenancePlan + Tasks from a completed inspection checklist.
   *
   * NOTE: This method uses `$transaction` directly because it orchestrates writes
   * across 5 tables (maintenancePlan, category, task, taskLog, inspectionItem) atomically.
   * No single repository owns this cross-domain operation. The pre-transaction reads
   * (checklist, existingPlan, templates) use repositories; only the transactional writes
   * remain as direct Prisma calls for atomicity.
   */
  async generatePlanFromInspection(checklistId: string, planName: string, createdBy: string) {
    const checklist = await this.repository.findByIdWithActiveItems(checklistId);
    if (!checklist) throw new NotFoundException('Inspección no encontrada');

    // All items must be evaluated
    const pendingItems = checklist.items.filter((i) => i.status === 'PENDING');
    if (pendingItems.length > 0) {
      throw new BadRequestException(
        `Quedan ${pendingItems.length} items sin evaluar. Completá la inspección antes de generar el plan.`,
      );
    }

    // Fast-path check: if a plan clearly already exists, fail before we do any
    // of the expensive template-fetch work. The unique constraint on
    // MaintenancePlan.propertyId is the authoritative protection against the
    // two-clicks-at-once race; the catch around tx.maintenancePlan.create below
    // turns the resulting P2002 into the same friendly message.
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
        ? await this.taskTemplatesRepository.findByIdsWithCategory(templateIds)
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

        // Create the plan. If a concurrent request beat us to it, Postgres will
        // raise a unique-violation on MaintenancePlan.propertyId — rethrow as a
        // ConflictException with the same message the fast-path check uses, so
        // the client sees a consistent error either way.
        let plan: { id: string };
        try {
          plan = await tx.maintenancePlan.create({
            data: {
              propertyId: checklist.propertyId,
              name: planName,
              status: 'DRAFT',
              sourceInspectionId: checklistId,
              createdBy,
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002' &&
            Array.isArray(err.meta?.target) &&
            (err.meta.target as string[]).includes('propertyId')
          ) {
            throw new ConflictException('Esta propiedad ya tiene un plan de mantenimiento');
          }
          throw err;
        }

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

          // Derive the first-cycle due date from the final priority + recurrence so that
          // the task lands in the correct stat card (Vencida / Próxima / Pendiente) and
          // the ISV compliance dimension has a valid reference date from day one.
          // ON_DETECTION tasks intentionally keep nextDueDate = null.
          const nextDueDate = suggestDueDate(priority, recurrenceType, recurrenceMonths);

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
              nextDueDate,
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

        // Lock the checklist: once a plan exists for it, editing items would
        // silently drift from the generated tasks. The write below is what the
        // later verifyChecklistAccessAndEditable / verifyItemAccessAndEditable
        // guards key off, and it stays in the same transaction as the plan/task
        // creation so an aborted run never leaves a half-locked checklist.
        await tx.inspectionChecklist.update({
          where: { id: checklistId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

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
    const ownership = await this.propertiesRepository.findOwnership(propertyId);
    if (!ownership) throw new NotFoundException('Propiedad no encontrada');
    if (ownership.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }
  }

  private async verifyChecklistAccess(checklistId: string) {
    const propertyId = await this.repository.findChecklistProperty(checklistId);
    if (!propertyId) throw new NotFoundException('Inspección no encontrada');
  }

  /** Like verifyChecklistAccess but also rejects once the checklist has been
   *  locked by a plan generation. Used by every mutation path. */
  private async verifyChecklistAccessAndEditable(checklistId: string) {
    const status = await this.repository.findChecklistStatus(checklistId);
    if (!status) throw new NotFoundException('Inspección no encontrada');
    if (status === 'COMPLETED') {
      throw new ForbiddenException(
        'La inspección ya generó un plan de mantenimiento y no es editable.',
      );
    }
  }

  private async verifyItemAccessAndEditable(itemId: string) {
    const info = await this.repository.findItemChecklistStatus(itemId);
    if (!info) throw new NotFoundException('Item de inspección no encontrado');
    if (info.status === 'COMPLETED') {
      throw new ForbiddenException(
        'La inspección ya generó un plan de mantenimiento y no es editable.',
      );
    }
  }
}
