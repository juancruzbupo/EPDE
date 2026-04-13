'use client';

import type { InspectionChecklist, InspectionItemStatus, PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { InspectionTour } from '@/components/onboarding-tour';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAddInspectionItem,
  useCreateInspection,
  useGeneratePlan,
  useInspections,
  useInspectionTemplates,
  useUpdateInspectionItem,
} from '@/hooks/use-inspections';

import { FindingDialog } from './dialogs/finding-dialog';
import { InspectionGuideDialog } from './dialogs/inspection-guide-dialog';
import { PlanGenerationDialog } from './dialogs/plan-generation-dialog';
import { STATUS_CONFIG } from './inspection-status-config';

interface InspectionTabProps {
  propertyId: string;
  activeSectors: PropertySector[];
  hasPlan?: boolean;
}

export function InspectionTab({ propertyId, activeSectors, hasPlan }: InspectionTabProps) {
  const { data: inspections, isLoading, error, refetch } = useInspections(propertyId);
  const { data: templates } = useInspectionTemplates(propertyId);
  const createInspection = useCreateInspection(propertyId);
  const updateItem = useUpdateInspectionItem(propertyId);
  const addItem = useAddInspectionItem(propertyId);
  const generatePlan = useGeneratePlan(propertyId);

  const [addingSector, setAddingSector] = useState<PropertySector | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [findingDialog, setFindingDialog] = useState<{
    itemId: string;
    status: InspectionItemStatus;
  } | null>(null);
  const [planNameDialog, setPlanNameDialog] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [guideItem, setGuideItem] = useState<InspectionChecklist['items'][0] | null>(null);

  const activeChecklist = inspections?.[0] ?? null;

  const allEvaluated = activeChecklist
    ? activeChecklist.items.length > 0 && activeChecklist.items.every((i) => i.status !== 'PENDING')
    : false;

  const handleNewInspection = () => {
    if (!templates || templates.length === 0) return;

    const items = templates.flatMap((group, sectorIdx) =>
      group.items.map((item, itemIdx) => ({
        sector: group.sector as PropertySector,
        name: item.name,
        description: item.description ?? undefined,
        taskTemplateId: item.taskTemplateId,
        status: 'PENDING' as const,
        isCustom: false,
        order: sectorIdx * 100 + itemIdx,
      })),
    );

    createInspection.mutate({ propertyId, items });
  };

  const handleUpdateItem = (itemId: string, status: InspectionItemStatus, finding?: string) => {
    updateItem.mutate({ itemId, status, finding });
  };

  const handleAddCustomItem = (sector: PropertySector) => {
    if (!activeChecklist || !customItemName.trim()) return;
    addItem.mutate(
      { checklistId: activeChecklist.id, sector, name: customItemName.trim(), isCustom: true },
      {
        onSuccess: () => {
          setCustomItemName('');
          setAddingSector(null);
        },
      },
    );
  };

  const handleGeneratePlan = (planName: string) => {
    if (!activeChecklist) return;
    generatePlan.mutate(
      { checklistId: activeChecklist.id, planName },
      { onSuccess: () => setPlanNameDialog(false) },
    );
  };

  const itemsBySector = useMemo(() => {
    if (!activeChecklist) return new Map<PropertySector, InspectionChecklist['items']>();
    const map = new Map<PropertySector, InspectionChecklist['items']>();
    for (const item of activeChecklist.items) {
      const sector = item.sector as PropertySector;
      const list = map.get(sector) ?? [];
      list.push(item);
      map.set(sector, list);
    }
    return map;
  }, [activeChecklist]);

  const sectorOrder = useMemo(() => {
    if (!activeChecklist) return activeSectors;
    return [...itemsBySector.keys()];
  }, [activeChecklist, activeSectors, itemsBySector]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Error al cargar inspecciones" onRetry={() => refetch()} />;
  }

  if (!activeChecklist) {
    const templateCount = templates?.reduce((acc, g) => acc + g.items.length, 0) ?? 0;

    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <ClipboardList className="text-muted-foreground/50 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            No hay inspecciones registradas para esta propiedad.
          </p>
          {templateCount > 0 && (
            <div className="text-muted-foreground space-y-1 text-center text-xs">
              <p>Se revisarán {templateCount} elementos de la vivienda, organizados por sector.</p>
              <p>
                Tiempo estimado: {Math.ceil(templateCount * 1.5)} – {Math.ceil(templateCount * 3)}{' '}
                minutos.
              </p>
              <p>Podés pausar y continuar en cualquier momento.</p>
            </div>
          )}
          <Button
            onClick={handleNewInspection}
            disabled={createInspection.isPending || templateCount === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Iniciar inspección
          </Button>
        </CardContent>
      </Card>
    );
  }

  const evaluatedCount = activeChecklist.items.filter((i) => i.status !== 'PENDING').length;

  return (
    <div className="space-y-4">
      <InspectionTour />
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="type-body-sm text-muted-foreground">
              Inspección del{' '}
              {new Date(activeChecklist.inspectedAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="type-body-sm text-muted-foreground">
              {evaluatedCount} de {activeChecklist.items.length} revisados
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewInspection}
            disabled={createInspection.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva inspección
          </Button>
        </div>

        {/* Progress bar */}
        <div data-tour="inspection-progress" className="space-y-1">
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((evaluatedCount / activeChecklist.items.length) * 100)}%`,
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {Math.round((evaluatedCount / activeChecklist.items.length) * 100)}% completado
          </p>
        </div>

        {/* Generate plan CTA — prominent when ready */}
        {allEvaluated && !hasPlan ? (
          <div className="bg-primary/5 border-primary/20 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">¡Inspección completa!</p>
              <p className="text-muted-foreground text-xs">
                Ya podés generar el plan de mantenimiento basado en los hallazgos.
              </p>
            </div>
            <Button onClick={() => setPlanNameDialog(true)} disabled={generatePlan.isPending}>
              <FileText className="mr-2 h-4 w-4" />
              Generar Plan
            </Button>
          </div>
        ) : allEvaluated && hasPlan ? (
          <div className="bg-success/5 border-success/20 flex items-center gap-2 rounded-lg border p-3">
            <CheckCircle className="text-success h-4 w-4 shrink-0" />
            <p className="text-muted-foreground text-sm">
              Inspección completa. Esta propiedad ya tiene un plan de mantenimiento activo.
            </p>
          </div>
        ) : !allEvaluated ? (
          <p className="text-muted-foreground text-xs">
            Evaluá todos los elementos para poder generar el plan de mantenimiento. Faltan{' '}
            {activeChecklist.items.length - evaluatedCount} elementos.
          </p>
        ) : null}
      </div>

      {sectorOrder.map((sector, sectorIndex) => {
        const items = itemsBySector.get(sector) ?? [];
        const completed = items.filter((i) => i.status !== 'PENDING').length;
        const isCollapsed = !expandedSectors.has(sector);
        const allDone = completed === items.length && items.length > 0;

        return (
          <Card key={sector} {...(sectorIndex === 0 ? { 'data-tour': 'inspection-sectors' } : {})}>
            <CardHeader
              className="cursor-pointer pb-3 select-none"
              onClick={() => {
                setExpandedSectors((prev) => {
                  const next = new Set(prev);
                  if (next.has(sector)) next.delete(sector);
                  else next.add(sector);
                  return next;
                });
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  )}
                  <CardTitle className="type-title-sm">
                    {PROPERTY_SECTOR_LABELS[sector] ?? sector}
                  </CardTitle>
                  {allDone && <CheckCircle className="text-success h-4 w-4" />}
                </div>
                <Badge variant={allDone ? 'success' : 'outline'}>
                  {completed}/{items.length}
                </Badge>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="space-y-2">
                {items.map((item) => {
                  const config = STATUS_CONFIG[item.status as InspectionItemStatus];
                  const Icon = config.icon;
                  const isUpdating =
                    updateItem.isPending && updateItem.variables?.itemId === item.id;

                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                          {(item.description || item.inspectionGuide) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-primary h-6 w-6 shrink-0 p-0"
                              aria-label="Ver guía de inspección"
                              {...(sectorIndex === 0 ? { 'data-tour': 'inspection-guide' } : {})}
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuideItem(item);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {item.finding && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Hallazgo: {item.finding}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {(
                          ['OK', 'NEEDS_ATTENTION', 'NEEDS_PROFESSIONAL'] as InspectionItemStatus[]
                        ).map((status) => {
                          const s = STATUS_CONFIG[status];
                          return (
                            <Button
                              key={status}
                              size="sm"
                              variant={item.status === status ? 'default' : 'outline'}
                              className="h-7 px-1.5 text-[11px] sm:px-2 sm:text-xs"
                              disabled={isUpdating}
                              onClick={() => {
                                if (
                                  status === 'NEEDS_ATTENTION' ||
                                  status === 'NEEDS_PROFESSIONAL'
                                ) {
                                  setFindingDialog({ itemId: item.id, status });
                                } else {
                                  handleUpdateItem(item.id, status);
                                }
                              }}
                            >
                              {s.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {addingSector === sector ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Nombre del item..."
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomItem(sector);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleAddCustomItem(sector)}
                        disabled={addItem.isPending}
                      >
                        Agregar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => setAddingSector(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingSector(sector)}
                    className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar observación
                  </button>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      <FindingDialog
        open={!!findingDialog}
        onOpenChange={(open) => {
          if (!open) setFindingDialog(null);
        }}
        itemId={findingDialog?.itemId ?? null}
        status={findingDialog?.status ?? null}
        isSaving={updateItem.isPending}
        onSave={(itemId, status, finding) => {
          handleUpdateItem(itemId, status, finding);
          setFindingDialog(null);
        }}
      />

      <PlanGenerationDialog
        open={planNameDialog}
        onOpenChange={setPlanNameDialog}
        taskCount={activeChecklist.items.length}
        isGenerating={generatePlan.isPending}
        onGenerate={handleGeneratePlan}
      />

      <InspectionGuideDialog item={guideItem} onClose={() => setGuideItem(null)} />
    </div>
  );
}
