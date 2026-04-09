'use client';

import type { InspectionChecklist, InspectionItemStatus, PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Markdown from 'react-markdown';

import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddInspectionItem,
  useCreateInspection,
  useGeneratePlan,
  useInspections,
  useInspectionTemplates,
  useUpdateInspectionItem,
} from '@/hooks/use-inspections';

const STATUS_CONFIG: Record<
  InspectionItemStatus,
  {
    label: string;
    icon: typeof CheckCircle;
    color: string;
    variant: 'success' | 'warning' | 'destructive' | 'secondary';
  }
> = {
  PENDING: {
    label: 'Pendiente',
    icon: Circle,
    color: 'text-muted-foreground',
    variant: 'secondary',
  },
  OK: { label: 'OK', icon: CheckCircle, color: 'text-success', variant: 'success' },
  NEEDS_ATTENTION: {
    label: 'Necesita atención',
    icon: AlertTriangle,
    color: 'text-warning',
    variant: 'warning',
  },
  NEEDS_PROFESSIONAL: {
    label: 'Requiere profesional',
    icon: Wrench,
    color: 'text-destructive',
    variant: 'destructive',
  },
};

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
  const [findingText, setFindingText] = useState('');
  const [planNameDialog, setPlanNameDialog] = useState(false);
  const [planName, setPlanName] = useState('');
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());
  const [guideItem, setGuideItem] = useState<InspectionChecklist['items'][0] | null>(null);

  const activeChecklist = inspections?.[0] ?? null;

  const allEvaluated = activeChecklist
    ? activeChecklist.items.length > 0 && activeChecklist.items.every((i) => i.status !== 'PENDING')
    : false;

  const canGeneratePlan = allEvaluated && !hasPlan;

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

  const handleGeneratePlan = () => {
    if (!activeChecklist || !planName.trim()) return;
    generatePlan.mutate(
      { checklistId: activeChecklist.id, planName: planName.trim() },
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
            <p className="text-muted-foreground text-xs">
              Se generarán {templateCount} puntos de inspección desde los templates de tareas.
            </p>
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
        <div className="flex gap-2">
          {canGeneratePlan && (
            <Button
              size="sm"
              onClick={() => {
                setPlanName('');
                setPlanNameDialog(true);
              }}
              disabled={generatePlan.isPending}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar Plan
            </Button>
          )}
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
      </div>

      {sectorOrder.map((sector) => {
        const items = itemsBySector.get(sector) ?? [];
        const completed = items.filter((i) => i.status !== 'PENDING').length;
        const isCollapsed = collapsedSectors.has(sector);
        const allDone = completed === items.length && items.length > 0;

        return (
          <Card key={sector}>
            <CardHeader
              className="cursor-pointer pb-3 select-none"
              onClick={() => {
                setCollapsedSectors((prev) => {
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
                      <div className="flex shrink-0 gap-1">
                        {(
                          ['OK', 'NEEDS_ATTENTION', 'NEEDS_PROFESSIONAL'] as InspectionItemStatus[]
                        ).map((status) => {
                          const s = STATUS_CONFIG[status];
                          return (
                            <Button
                              key={status}
                              size="sm"
                              variant={item.status === status ? 'default' : 'outline'}
                              className="h-7 px-2 text-xs"
                              disabled={isUpdating}
                              onClick={() => {
                                if (
                                  status === 'NEEDS_ATTENTION' ||
                                  status === 'NEEDS_PROFESSIONAL'
                                ) {
                                  setFindingDialog({ itemId: item.id, status });
                                  setFindingText('');
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
                  <div className="flex gap-2">
                    <Input
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Nombre del item..."
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomItem(sector);
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddCustomItem(sector)}
                      disabled={addItem.isPending}
                    >
                      Agregar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingSector(null)}>
                      Cancelar
                    </Button>
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

      {/* Finding dialog */}
      <Dialog
        open={!!findingDialog}
        onOpenChange={(open) => {
          if (!open) setFindingDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué encontraste?</DialogTitle>
          </DialogHeader>
          <Textarea
            value={findingText}
            onChange={(e) => setFindingText(e.target.value)}
            placeholder="Describí el hallazgo..."
            rows={3}
            className="resize-none"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindingDialog(null)}>
              Cancelar
            </Button>
            <Button
              disabled={updateItem.isPending}
              onClick={() => {
                if (findingDialog) {
                  handleUpdateItem(findingDialog.itemId, findingDialog.status, findingText);
                  setFindingDialog(null);
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate plan dialog */}
      <Dialog open={planNameDialog} onOpenChange={setPlanNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar plan de mantenimiento</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Se crearán {activeChecklist.items.length} tareas basadas en la inspección. Las
            prioridades se ajustarán según los hallazgos.
          </p>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Nombre del plan..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && planName.trim()) handleGeneratePlan();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanNameDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGeneratePlan}
              disabled={!planName.trim() || generatePlan.isPending}
            >
              Generar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection guide dialog */}
      <Dialog
        open={!!guideItem}
        onOpenChange={(open) => {
          if (!open) setGuideItem(null);
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {guideItem?.name}
            </DialogTitle>
            <div className="flex gap-2 pt-1">
              {guideItem?.sector && (
                <Badge variant="outline" className="text-xs">
                  {PROPERTY_SECTOR_LABELS[guideItem.sector as PropertySector] ?? guideItem.sector}
                </Badge>
              )}
              {guideItem?.status && guideItem.status !== 'PENDING' && (
                <Badge
                  variant={
                    STATUS_CONFIG[guideItem.status as InspectionItemStatus]?.variant ?? 'secondary'
                  }
                  className="text-xs"
                >
                  {STATUS_CONFIG[guideItem.status as InspectionItemStatus]?.label ??
                    guideItem.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Markdown guide (priority) or fallback to description */}
          {guideItem?.inspectionGuide ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{guideItem.inspectionGuide}</Markdown>
            </div>
          ) : guideItem?.description ? (
            <div className="space-y-3">
              <InspectionGuideContent description={guideItem.description} />
            </div>
          ) : null}

          {/* Guide images gallery */}
          {guideItem?.guideImageUrls && guideItem.guideImageUrls.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-semibold">
                  Imágenes de referencia
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {guideItem.guideImageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Referencia ${i + 1} para ${guideItem.name}`}
                      className="rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {guideItem?.finding && (
            <>
              <Separator />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Hallazgo registrado
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {guideItem.finding}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Parses technicalDescription into formatted sections with highlighted criteria. */
function InspectionGuideContent({ description }: { description: string }) {
  // Split by "ATENCIÓN si:" and "PROFESIONAL si:" / "PROFESIONAL URGENTE si:"
  const attentionMatch = description.match(/ATENCIÓN si:\s*(.*?)(?=PROFESIONAL|$)/s);
  const professionalMatch = description.match(/PROFESIONAL(?:\s+URGENTE)?\s+si:\s*(.*?)$/s);

  // Main text is everything before "ATENCIÓN si:" or "PROFESIONAL si:"
  const mainText = description
    .replace(/ATENCIÓN si:.*$/s, '')
    .replace(/PROFESIONAL(?:\s+URGENTE)?\s+si:.*$/s, '')
    .trim();

  return (
    <>
      <p className="text-foreground text-sm leading-relaxed">{mainText}</p>

      {attentionMatch?.[1] && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
            ⚠️ Marcar &quot;Necesita atención&quot; si:
          </p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {attentionMatch[1].trim().replace(/\.\s*$/, '')}
          </p>
        </div>
      )}

      {professionalMatch?.[1] && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-xs font-semibold text-red-800 dark:text-red-200">
            🔴 Marcar &quot;Requiere profesional&quot; si:
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {professionalMatch[1].trim().replace(/\.\s*$/, '')}
          </p>
        </div>
      )}
    </>
  );
}
