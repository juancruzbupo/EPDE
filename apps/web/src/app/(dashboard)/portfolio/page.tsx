'use client';

import { TaskStatus } from '@epde/shared';
import { ChevronRight, FileText, Home } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTasks } from '@/hooks/use-plans';
import { useProperties } from '@/hooks/use-properties';
import { ROUTES } from '@/lib/routes';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Portfolio comparativo — apunta a Jorge (persona D, inversor con 2-3
 * propiedades). Reemplaza el scrolleo por propiedades individuales con
 * una tabla única que compara ISV, tareas vencidas, pendientes y
 * presupuestos abiertos.
 *
 * MVP lean: consume endpoints existentes (useProperties +
 * useAllTasks) en vez de crear un endpoint /dashboard/portfolio
 * nuevo. El costo: 1 request de propiedades + 1 de tareas, ambos ya
 * cacheados por React Query para otras pantallas. Si a futuro vemos
 * más de ~5 propiedades promedio, migramos a un endpoint optimizado
 * con agregación server-side.
 */
export default function PortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const {
    data: propertiesData,
    isLoading: propsLoading,
    isError: propsError,
    refetch: refetchProps,
  } = useProperties({ userId: userId ?? undefined });
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useAllTasks();

  const properties = useMemo(
    () => propertiesData?.pages.flatMap((p) => p.data) ?? [],
    [propertiesData],
  );

  /** Agrega stats de tareas por propertyId a partir del listado completo. */
  const statsByProperty = useMemo(() => {
    const map = new Map<string, { overdue: number; pending: number; completed: number }>();
    if (!tasks) return map;
    for (const t of tasks) {
      const propId = t.maintenancePlan?.property.id;
      if (!propId) continue;
      const current = map.get(propId) ?? { overdue: 0, pending: 0, completed: 0 };
      if (t.status === TaskStatus.OVERDUE) current.overdue += 1;
      else if (t.status === TaskStatus.PENDING || t.status === TaskStatus.UPCOMING)
        current.pending += 1;
      else if (t.status === TaskStatus.COMPLETED) current.completed += 1;
      map.set(propId, current);
    }
    return map;
  }, [tasks]);

  const isLoading = propsLoading || tasksLoading;
  const isError = propsError || tasksError;

  if (isError) {
    return (
      <PageTransition>
        <PageHeader title="Mi portfolio" description="Vista comparativa de tus propiedades" />
        <ErrorState
          message="No se pudieron cargar los datos del portfolio"
          onRetry={() => {
            void refetchProps();
            void refetchTasks();
          }}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Mi portfolio"
        description="Vista comparativa de tus propiedades — compará ISV, tareas pendientes y actividad en una sola tabla."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="text-muted-foreground mx-auto mb-3 h-10 w-10" aria-hidden="true" />
            <p className="type-body-md text-foreground mb-1">No tenés propiedades registradas</p>
            <p className="type-body-sm text-muted-foreground">
              EPDE registra tu vivienda después del diagnóstico inicial.
            </p>
          </CardContent>
        </Card>
      ) : properties.length === 1 ? (
        // Con una sola propiedad, el portfolio no aporta valor comparativo —
        // redirigimos visualmente al detalle de esa propiedad.
        <Card>
          <CardContent className="py-8 text-center">
            <Home className="text-muted-foreground mx-auto mb-3 h-10 w-10" aria-hidden="true" />
            <p className="type-body-md text-foreground mb-4">
              Tenés una sola propiedad — el portfolio es útil a partir de la segunda.
            </p>
            <Button asChild>
              <Link href={ROUTES.property(properties[0]!.id)}>
                Ver detalle de {properties[0]!.address}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vista mobile: cards apiladas (tabla se comprime demasiado). */}
          <div className="space-y-3 sm:hidden">
            {properties.map((prop) => {
              const stats = statsByProperty.get(prop.id) ?? {
                overdue: 0,
                pending: 0,
                completed: 0,
              };
              return (
                <Card key={prop.id}>
                  <CardContent className="p-4">
                    <Link
                      href={ROUTES.property(prop.id)}
                      className="hover:text-primary flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="type-title-sm text-foreground truncate font-semibold">
                          {prop.address}
                        </p>
                        <p className="type-body-sm text-muted-foreground truncate">{prop.city}</p>
                      </div>
                      <ChevronRight
                        className="text-muted-foreground ml-2 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
                      <StatCell label="Vencidas" value={stats.overdue} tone="danger" />
                      <StatCell label="Pendientes" value={stats.pending} />
                      <StatCell label="Completadas" value={stats.completed} tone="success" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={ROUTES.property(prop.id)}>Ver detalle</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={ROUTES.propertyReport(prop.id)}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Informe
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Vista desktop: tabla comparativa. */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-muted-foreground type-label-sm uppercase">
                    <th className="p-3 text-left font-medium">Propiedad</th>
                    <th className="p-3 text-center font-medium">Vencidas</th>
                    <th className="p-3 text-center font-medium">Pendientes</th>
                    <th className="p-3 text-center font-medium">Completadas</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => {
                    const stats = statsByProperty.get(prop.id) ?? {
                      overdue: 0,
                      pending: 0,
                      completed: 0,
                    };
                    return (
                      <tr key={prop.id} className="hover:bg-muted/40 border-b transition-colors">
                        <td className="p-3">
                          <Link href={ROUTES.property(prop.id)} className="hover:text-primary">
                            <p className="type-body-md text-foreground font-medium">
                              {prop.address}
                            </p>
                            <p className="type-body-sm text-muted-foreground">{prop.city}</p>
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          {stats.overdue > 0 ? (
                            <Badge variant="destructive">{stats.overdue}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-foreground">{stats.pending || '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-success">{stats.completed || '—'}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={ROUTES.property(prop.id)}>Detalle</Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost">
                              <Link href={ROUTES.propertyReport(prop.id)}>
                                <FileText className="mr-1 h-3.5 w-3.5" />
                                Informe
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </PageTransition>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'danger' | 'success';
}) {
  const color =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'success'
        ? 'text-success'
        : 'text-foreground';
  return (
    <div className="text-center">
      <p className={`type-title-md font-bold ${color}`}>{value}</p>
      <p className="type-label-sm text-muted-foreground">{label}</p>
    </div>
  );
}
