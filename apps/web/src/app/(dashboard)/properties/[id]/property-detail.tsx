'use client';

import type { DetectedProblem, PropertyPublic } from '@epde/shared';
import {
  CONDITION_FOUND_LABELS,
  type ConditionFound,
  PROPERTY_SECTOR_LABELS,
  PROPERTY_TYPE_LABELS,
  type PropertySector,
} from '@epde/shared';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Pencil,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { HealthIndexCard } from '@/components/health-index-card';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProperty,
  usePropertyExpenses,
  usePropertyHealthHistory,
  usePropertyHealthIndex,
  usePropertyPhotos,
  usePropertyProblems,
} from '@/hooks/use-properties';

import { CreateServiceDialog } from '../../service-requests/create-service-dialog';
import { EditPropertyDialog } from './edit-property-dialog';
import { PlanEditor } from './plan-editor';
import { PlanViewer } from './plan-viewer';

interface PropertyDetailProps {
  id: string;
  isAdmin: boolean;
  initialData?: PropertyPublic;
}

export function PropertyDetail({ id, isAdmin, initialData }: PropertyDetailProps) {
  const { data, isLoading, isError, refetch } = useProperty(id, { initialData });
  const property = data;
  const { data: problemsCount } = usePropertyProblems(id);
  const [editOpen, setEditOpen] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'health');

  if (isError && !property) {
    return <ErrorState message="No se pudo cargar la propiedad" onRetry={refetch} />;
  }

  if (isLoading && !property) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 h-10 w-64 animate-pulse rounded" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted/40 h-6 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={property.address}
          description={[
            property.city,
            PROPERTY_TYPE_LABELS[property.type] ?? property.type,
            property.yearBuilt && `${property.yearBuilt}`,
            property.squareMeters && `${property.squareMeters} m²`,
            property.user && `Cliente: ${property.user.name}`,
          ]
            .filter(Boolean)
            .join(' · ')}
          action={
            <div className="no-print flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/properties">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${id}/report`}>Ver Informe</Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health">
            Salud{problemsCount && problemsCount.length > 0 ? ` (${problemsCount.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          {property.maintenancePlan ? (
            isAdmin ? (
              <PlanEditor
                planId={property.maintenancePlan.id}
                activeSectors={property.activeSectors}
              />
            ) : (
              <PlanViewer planId={property.maintenancePlan.id} propertyId={property.id} />
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12">
                <ClipboardList className="text-muted-foreground/60 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No hay plan de mantenimiento asociado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {activeTab === 'expenses' && <PropertyExpensesTab propertyId={property.id} />}
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          {activeTab === 'photos' && <PropertyPhotosTab propertyId={property.id} />}
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          {activeTab === 'health' && (
            <PropertyHealthTab propertyId={property.id} address={property.address} />
          )}
        </TabsContent>
      </Tabs>

      {isAdmin && (
        <EditPropertyDialog
          key={property.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          property={property}
        />
      )}
    </div>
  );
}

// ─── Expenses Tab ───────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);

function PropertyExpensesTab({ propertyId }: { propertyId: string }) {
  const { data: expenses, isLoading, isError, refetch } = usePropertyExpenses(propertyId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'category' | 'sector'>('sector');

  const analytics = useMemo(() => {
    if (!expenses || expenses.items.length === 0) return null;

    const items = expenses.items;
    const dates = items.map((i) => new Date(i.date).getTime());
    const oldest = new Date(Math.min(...dates));
    const months = Math.max(
      1,
      Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );
    const monthlyAvg = expenses.totalCost / months;

    // Group by category
    const byCategory = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const cat = item.category ?? 'Presupuestos';
      const entry = byCategory.get(cat) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      byCategory.set(cat, entry);
    }
    const categories = [...byCategory.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const topCategory = categories[0];
    const maxCategoryTotal = topCategory?.total ?? 0;

    // Sector grouping
    const bySector = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const sec = item.sector ?? 'Sin sector';
      const entry = bySector.get(sec) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      bySector.set(sec, entry);
    }
    const sectors = [...bySector.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
    const maxSectorTotal = sectors[0]?.total ?? 0;

    // Task vs Budget split
    const taskTotal = items.filter((i) => i.type === 'task').reduce((s, i) => s + i.amount, 0);
    const budgetTotal = items.filter((i) => i.type === 'budget').reduce((s, i) => s + i.amount, 0);

    return {
      months,
      monthlyAvg,
      categories,
      topCategory,
      maxCategoryTotal,
      sectors,
      maxSectorTotal,
      taskTotal,
      budgetTotal,
    };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="bg-muted/40 h-16 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/40 h-8 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar los gastos" onRetry={refetch} className="py-12" />
    );
  }

  if (!expenses || expenses.items.length === 0 || !analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <DollarSign className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay gastos registrados para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <DollarSign className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total acumulado</p>
                <p className="type-number-md text-foreground">
                  {formatCurrency(expenses.totalCost)}
                </p>
                <p className="text-muted-foreground text-xs">
                  en {analytics.months} mes{analytics.months !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Costo mensual promedio</p>
                <p className="type-number-md text-foreground">
                  {formatCurrency(analytics.monthlyAvg)}
                </p>
                <p className="text-muted-foreground text-xs">/mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <ClipboardList className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Categoría principal</p>
                <p className="type-title-sm text-foreground truncate">
                  {analytics.topCategory?.name ?? '—'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {analytics.topCategory
                    ? `${formatCurrency(analytics.topCategory.total)} (${analytics.topCategory.count} items)`
                    : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preventive savings insight */}
      {analytics && analytics.taskTotal > 0 && (
        <div className="bg-success/5 border-success/20 rounded-lg border p-3">
          <p className="type-body-sm text-success font-medium">
            El mantenimiento preventivo reduce hasta un 80% el costo de reparaciones mayores. Tu
            inversión en tareas preventivas contribuye a preservar el valor de tu vivienda.
          </p>
        </div>
      )}

      {/* Row 2 — Breakdown with toggle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="type-title-md">
              Gasto por {groupBy === 'sector' ? 'sector' : 'categoría'}
            </CardTitle>
            <p className="type-body-sm text-muted-foreground">
              Tareas: {formatCurrency(analytics.taskTotal)} · Presupuestos:{' '}
              {formatCurrency(analytics.budgetTotal)}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setGroupBy('sector')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                groupBy === 'sector'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Sector
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                groupBy === 'category'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Categoría
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(groupBy === 'sector' ? analytics.sectors : analytics.categories).map((item) => {
              const maxTotal =
                groupBy === 'sector' ? analytics.maxSectorTotal : analytics.maxCategoryTotal;
              const pct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
              const label =
                groupBy === 'sector'
                  ? (PROPERTY_SECTOR_LABELS[item.name as PropertySector] ?? item.name)
                  : item.name;
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {item.count} item{item.count !== 1 ? 's' : ''} ·{' '}
                    {Math.round((item.total / expenses.totalCost) * 100)}% del total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Row 3 — Collapsible History */}
      <Card>
        <button
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex w-full items-center justify-between p-6 text-left"
        >
          <div>
            <p className="type-title-md">Historial detallado</p>
            <p className="type-body-sm text-muted-foreground">
              {expenses.items.length} movimiento{expenses.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          {historyOpen ? (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {historyOpen && (
          <CardContent className="border-t pt-4">
            <div className="divide-y">
              {expenses.items.map((item) => (
                <div
                  key={`${item.date}-${item.description}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.category ?? 'Presupuesto'} ·{' '}
                      {new Date(item.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.type === 'task' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.type === 'task' ? 'Tarea' : 'Presupuesto'}
                    </Badge>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ─── Photos Tab ─────────────────────────────────────────

function PropertyPhotosTab({ propertyId }: { propertyId: string }) {
  const { data: photos, isLoading, isError, refetch } = usePropertyPhotos(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/40 aspect-square animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar las fotos" onRetry={refetch} className="py-12" />
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <Camera className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay fotos registradas para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">Galería de Fotos ({photos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <a
              key={`${photo.url}-${photo.date}`}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <img
                src={photo.url}
                alt={photo.description}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs font-medium text-white">{photo.description}</p>
                <p className="text-xs text-white/70">
                  {photo.source === 'task' ? 'Tarea' : 'Solicitud'} ·{' '}
                  {new Date(photo.date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Health Tab ──────────────────────────────────────────

function getImpactMessage(sector: string | null): string {
  switch (sector) {
    case 'ROOF':
      return 'Puede generar filtraciones y daños mayores';
    case 'BATHROOM':
    case 'KITCHEN':
      return 'Puede provocar humedad y deterioro';
    case 'INSTALLATIONS':
      return 'Puede afectar la seguridad de la instalación';
    case 'BASEMENT':
      return 'Puede comprometer la estructura';
    case 'EXTERIOR':
    case 'GARDEN':
      return 'Puede empeorar con la intemperie';
    default:
      return 'Puede empeorar si no se trata a tiempo';
  }
}

function PropertyHealthTab({ propertyId, address }: { propertyId: string; address: string }) {
  const { data: healthIndex, isLoading } = usePropertyHealthIndex(propertyId);
  const { data: history } = usePropertyHealthHistory(propertyId);
  const { data: problems } = usePropertyProblems(propertyId);
  const [serviceDialogProblem, setServiceDialogProblem] = useState<DetectedProblem | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted/40 h-8 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthIndex || healthIndex.score === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <DollarSign className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay datos suficientes para calcular el índice de salud.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <HealthIndexCard index={healthIndex} history={history} address={address} />

      {/* Detected problems */}
      {problems && problems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-4 w-4" />
              <CardTitle className="text-base">
                Esto puede generarte gastos si no lo resolvés
                <Badge variant="destructive" className="ml-2">
                  {problems.length}
                </Badge>
              </CardTitle>
            </div>
            <p className="type-body-sm text-muted-foreground mt-1">
              Detectamos problemas que pueden empeorar con el tiempo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {problems.map((problem) => (
              <div
                key={problem.taskId}
                className="border-border hover:border-primary/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="type-body-md text-foreground truncate font-medium">
                      {problem.taskName}
                    </span>
                    <Badge variant={problem.severity === 'high' ? 'destructive' : 'warning'}>
                      {CONDITION_FOUND_LABELS[problem.conditionFound as ConditionFound] ??
                        problem.conditionFound}
                    </Badge>
                  </div>
                  <span className="type-body-sm text-muted-foreground">
                    {getImpactMessage(problem.sector)}
                  </span>
                  {problem.severity === 'high' && (
                    <p className="type-body-sm text-destructive mt-0.5 font-medium">
                      Recomendado resolver cuanto antes
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServiceDialogProblem(problem)}
                >
                  Solicitar servicio
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Service request dialog triggered from problem */}
      {serviceDialogProblem && (
        <CreateServiceDialog
          open={!!serviceDialogProblem}
          onOpenChange={(open) => !open && setServiceDialogProblem(null)}
          defaultPropertyId={propertyId}
          defaultTaskId={serviceDialogProblem.taskId}
          defaultTitle={`Problema: ${serviceDialogProblem.taskName}`}
          defaultDescription={
            serviceDialogProblem.notes ??
            `Condición: ${CONDITION_FOUND_LABELS[serviceDialogProblem.conditionFound as ConditionFound] ?? serviceDialogProblem.conditionFound}`
          }
        />
      )}
    </div>
  );
}
