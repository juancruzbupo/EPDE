'use client';

import type { InspectionChecklist, InspectionItemStatus, PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import { AlertTriangle, CheckCircle, Circle, ClipboardList, Plus, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  addInspectionItem,
  createInspection,
  getInspections,
  updateInspectionItem,
} from '@/lib/api/inspections';

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
}

export function InspectionTab({ propertyId, activeSectors }: InspectionTabProps) {
  const [_inspections, setInspections] = useState<InspectionChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChecklist, setActiveChecklist] = useState<InspectionChecklist | null>(null);
  const [addingSector, setAddingSector] = useState<PropertySector | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInspections(propertyId);
      setInspections(res.data);
      if (res.data.length > 0) setActiveChecklist(res.data[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleNewInspection = async () => {
    const defaultItems = activeSectors.flatMap((sector, sectorIdx) =>
      getDefaultItemsForSector(sector).map((item, itemIdx) => ({
        sector,
        name: item.name,
        description: item.description,
        status: 'PENDING' as const,
        isCustom: false,
        order: sectorIdx * 100 + itemIdx,
      })),
    );

    try {
      const res = await createInspection({ propertyId, items: defaultItems });
      toast.success('Nueva inspección creada');
      setInspections((prev) => [res.data, ...prev]);
      setActiveChecklist(res.data);
    } catch {
      toast.error('Error al crear inspección');
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    status: InspectionItemStatus,
    finding?: string,
  ) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await updateInspectionItem(itemId, { status, finding });
      setActiveChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? { ...item, status, ...(finding !== undefined && { finding }) }
              : item,
          ),
        };
      });
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleAddCustomItem = async (sector: PropertySector) => {
    if (!activeChecklist || !customItemName.trim()) return;
    try {
      await addInspectionItem(activeChecklist.id, {
        sector,
        name: customItemName.trim(),
        isCustom: true,
      });
      setCustomItemName('');
      setAddingSector(null);
      toast.success('Item agregado');
      await loadInspections();
    } catch {
      toast.error('Error al agregar item');
    }
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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!activeChecklist) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <ClipboardList className="text-muted-foreground/50 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            No hay inspecciones registradas para esta propiedad.
          </p>
          <Button onClick={handleNewInspection}>
            <Plus className="mr-2 h-4 w-4" />
            Iniciar inspección
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            {activeChecklist.items.filter((i) => i.status !== 'PENDING').length} de{' '}
            {activeChecklist.items.length} revisados
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewInspection}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva inspección
        </Button>
      </div>

      {activeSectors.map((sector) => {
        const items = itemsBySector.get(sector) ?? [];
        const completed = items.filter((i) => i.status !== 'PENDING').length;

        return (
          <Card key={sector}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="type-title-sm">{PROPERTY_SECTOR_LABELS[sector]}</CardTitle>
                <Badge variant="outline">
                  {completed}/{items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const config = STATUS_CONFIG[item.status as InspectionItemStatus];
                const Icon = config.icon;
                const isUpdating = updatingItems.has(item.id);

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
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {item.description}
                        </p>
                      )}
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
                              if (status === 'NEEDS_ATTENTION' || status === 'NEEDS_PROFESSIONAL') {
                                const finding = prompt('¿Qué encontraste?');
                                if (finding !== null) handleUpdateItem(item.id, status, finding);
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
                  <Button size="sm" onClick={() => handleAddCustomItem(sector)}>
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
          </Card>
        );
      })}
    </div>
  );
}

// ─── Default inspection items per sector ────────────────

function getDefaultItemsForSector(sector: PropertySector): { name: string; description: string }[] {
  const ITEMS: Record<PropertySector, { name: string; description: string }[]> = {
    EXTERIOR: [
      {
        name: 'Estado de muros exteriores',
        description: 'Buscar fisuras, manchas de humedad, descascaramiento de pintura o revoque.',
      },
      {
        name: 'Revestimientos y pintura',
        description: 'Verificar adherencia, ampollas, decoloración.',
      },
      {
        name: 'Juntas de dilatación',
        description: 'Comprobar que estén selladas y sin material faltante.',
      },
      {
        name: 'Desagües pluviales',
        description: 'Verificar que no estén obstruidos y que el agua escurra correctamente.',
      },
      {
        name: 'Veredas perimetrales',
        description: 'Revisar pendientes, fisuras, separación del muro.',
      },
    ],
    ROOF: [
      {
        name: 'Estado de la cubierta',
        description: 'Revisar tejas, membrana o chapa: fisuras, roturas, levantamientos.',
      },
      {
        name: 'Canaletas y bajadas',
        description: 'Verificar limpieza, pendiente correcta, uniones selladas.',
      },
      {
        name: 'Babetas y encuentros',
        description: 'Revisar sellado en uniones con muros, chimeneas, ventilaciones.',
      },
      { name: 'Ventilaciones', description: 'Comprobar que estén libres de obstrucciones.' },
    ],
    TERRACE: [
      {
        name: 'Membrana impermeabilizante',
        description:
          'Buscar burbujas, fisuras, desprendimientos. Verificar fecha de última aplicación.',
      },
      {
        name: 'Pendientes y desagües',
        description: 'Verificar que el agua no se acumule en ningún punto.',
      },
      {
        name: 'Barandas y bordes',
        description: 'Revisar fijación, oxidación, altura reglamentaria.',
      },
      { name: 'Solado', description: 'Buscar fisuras, baldosas flojas o faltantes.' },
    ],
    INTERIOR: [
      {
        name: 'Paredes y cielorrasos',
        description: 'Buscar manchas de humedad, fisuras, desprendimientos.',
      },
      { name: 'Pisos', description: 'Revisar nivelación, fisuras, juntas deterioradas.' },
      { name: 'Aberturas', description: 'Verificar cierre correcto, sellado, estado de burletes.' },
      { name: 'Ventilación natural', description: 'Comprobar circulación de aire en ambientes.' },
    ],
    KITCHEN: [
      {
        name: 'Grifería y conexiones',
        description: 'Buscar pérdidas en canillas, flexibles, llaves de paso.',
      },
      {
        name: 'Desagües',
        description: 'Verificar velocidad de desagote, buscar pérdidas bajo mesada.',
      },
      {
        name: 'Conexión de gas',
        description: 'Revisar flexible, llave de paso, fecha de vencimiento del flexible.',
      },
      {
        name: 'Ventilación y extracción',
        description: 'Verificar funcionamiento de extractor y ventilación reglamentaria.',
      },
    ],
    BATHROOM: [
      {
        name: 'Grifería y conexiones',
        description: 'Buscar pérdidas en canillas, flexibles, válvulas.',
      },
      {
        name: 'Desagües y sifones',
        description: 'Verificar velocidad de desagote, olores, pérdidas.',
      },
      {
        name: 'Sellado de ducha/bañera',
        description: 'Revisar silicona, juntas, estado del rejunte.',
      },
      { name: 'Ventilación', description: 'Verificar extractor o ventilación natural.' },
    ],
    BASEMENT: [
      {
        name: 'Humedad ascendente',
        description: 'Buscar manchas, eflorescencias, moho en la base de muros.',
      },
      {
        name: 'Fundaciones visibles',
        description: 'Revisar fisuras, desprendimientos, signos de asentamiento.',
      },
      {
        name: 'Ventilación del subsuelo',
        description: 'Verificar rejillas y circulación de aire.',
      },
      {
        name: 'Instalaciones visibles',
        description: 'Revisar estado de cañerías y cables expuestos.',
      },
    ],
    GARDEN: [
      {
        name: 'Árboles cerca de muros',
        description: 'Verificar que raíces no afecten cimientos ni cañerías.',
      },
      {
        name: 'Pendientes del terreno',
        description: 'Comprobar que el agua escurra hacia afuera de la vivienda.',
      },
      { name: 'Cercos y medianeras', description: 'Revisar estado, fijación, inclinación.' },
    ],
    INSTALLATIONS: [
      {
        name: 'Tablero eléctrico',
        description: 'Verificar térmicas, diferencial, puesta a tierra. Probar botón de test.',
      },
      {
        name: 'Cañerías de agua',
        description: 'Revisar llaves de paso, estado de cañerías visibles, presión.',
      },
      {
        name: 'Tanque de agua',
        description: 'Verificar tapa, flotante, estado general, fecha de última limpieza.',
      },
      {
        name: 'Termotanque/calefón',
        description: 'Revisar piloto, tiraje, ventilación, estado del ánodo (si aplica).',
      },
      {
        name: 'Instalación de gas',
        description: 'Verificar artefactos, ventilaciones reglamentarias, estado de flexibles.',
      },
    ],
  };

  return ITEMS[sector] ?? [];
}
