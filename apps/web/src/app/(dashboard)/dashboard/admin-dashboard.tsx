'use client';

import type { ActivityItem, PropertySector } from '@epde/shared';
import {
  ActivityType,
  formatARSCompact,
  formatRelativeDate,
  PROPERTY_SECTOR_LABELS,
} from '@epde/shared';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  DollarSign,
  FileText,
  Home,
  PieChart,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AttentionNeeded } from '@/components/attention-needed';
import { BudgetPipelineChart } from '@/components/charts/budget-pipeline-chart';
import { CategoryCostsChart } from '@/components/charts/category-costs-chart';
import { ChartCard } from '@/components/charts/chart-card';
import { CompletionTrendChart } from '@/components/charts/completion-trend-chart';
import { ConditionDonutChart } from '@/components/charts/condition-donut-chart';
import { ProblematicCategoriesChart } from '@/components/charts/problematic-categories-chart';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAnalytics, useDashboardActivity, useDashboardStats } from '@/hooks/use-dashboard';
import { FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) => formatARSCompact(v);

/** Resolve a dashboard activity item to an internal route. */
function getActivityHref(item: ActivityItem): string | null {
  const m = item.metadata as Record<string, string> | undefined;
  if (!m) return null;

  switch (item.type) {
    case ActivityType.CLIENT_CREATED:
      return m.clientId ? `/clients/${m.clientId}` : null;
    case ActivityType.PROPERTY_CREATED:
      return m.propertyId ? `/properties/${m.propertyId}` : null;
    case ActivityType.TASK_COMPLETED:
      return '/tasks';
    case ActivityType.BUDGET_REQUESTED:
      return m.budgetId ? `/budgets/${m.budgetId}` : null;
    case ActivityType.SERVICE_REQUESTED:
      return m.serviceRequestId ? `/service-requests/${m.serviceRequestId}` : null;
    default:
      return null;
  }
}

function MonthSelector({
  chartMonths,
  onChange,
}: {
  chartMonths: number;
  onChange: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="type-body-sm text-muted-foreground">Periodo:</span>
      {([3, 6, 12] as const).map((m) => (
        <button
          key={m}
          aria-label={`Mostrar últimos ${m} meses`}
          onClick={() => onChange(m)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            chartMonths === m
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-accent'
          }`}
        >
          {m} meses
        </button>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useDashboardActivity();
  const [chartMonths, setChartMonths] = useState(6);
  const [analyticsTab, setAnalyticsTab] = useState('operational');
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics(chartMonths);
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      {/* Level 1: Executive summary KPIs */}
      <div className="mb-6">
        {statsLoading ? (
          <div role="status" aria-label="Cargando...">
            <Card>
              <CardContent className="p-6">
                <SkeletonShimmer className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : statsError ? (
          <ErrorState message="No se pudieron cargar las estadísticas" onRetry={refetchStats} />
        ) : stats ? (
          <Wrapper
            {...(shouldAnimate
              ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' }
              : {})}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Users className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="type-number-md text-foreground">
                        <AnimatedNumber value={stats.totalClients} />
                      </p>
                      <p className="type-label-sm text-muted-foreground">Clientes</p>
                    </div>
                  </div>

                  <span className="text-muted-foreground hidden sm:inline">·</span>

                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Home className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="type-number-md text-foreground">
                        <AnimatedNumber value={stats.totalProperties} />
                      </p>
                      <p className="type-label-sm text-muted-foreground">Propiedades</p>
                    </div>
                  </div>

                  <span className="text-muted-foreground hidden sm:inline">·</span>

                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                      <TrendingUp className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      {analytics ? (
                        <p
                          className={`type-number-md ${
                            analytics.completionRate >= 80
                              ? 'text-success'
                              : analytics.completionRate >= 60
                                ? 'text-amber-600'
                                : 'text-destructive'
                          }`}
                        >
                          {analytics.completionRate}%
                        </p>
                      ) : (
                        <p className="type-number-md text-muted-foreground">—</p>
                      )}
                      <p className="type-label-sm text-muted-foreground">Tasa de completado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Wrapper>
        ) : null}
      </div>

      {/* Level 2: Attention Needed */}
      <div className="mb-6">{stats && <AttentionNeeded stats={stats} />}</div>

      {/* Level 3: Admin Analytics Tabs */}
      <div className="mb-6">
        <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="operational">Operativo</TabsTrigger>
              <TabsTrigger value="trends">Tendencias</TabsTrigger>
              <TabsTrigger value="financial">Financiero</TabsTrigger>
            </TabsList>
            <MonthSelector chartMonths={chartMonths} onChange={setChartMonths} />
          </div>

          {/* Operativo tab */}
          <TabsContent value="operational">
            {analyticsTab === 'operational' &&
              (analyticsLoading ? (
                <div className="grid gap-6 lg:grid-cols-3">
                  <SkeletonShimmer className="h-[300px] lg:col-span-2" />
                  <SkeletonShimmer className="h-[300px]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    <SectionErrorBoundary>
                      <ChartCard
                        title="Tareas Completadas"
                        description={`Últimos ${chartMonths} meses`}
                        className="lg:col-span-2"
                        isLoading={false}
                        isEmpty={!analytics?.completionTrend.length}
                        emptyIcon={<TrendingUp className="h-8 w-8" />}
                        height={280}
                        href="/tasks"
                      >
                        {analytics && <CompletionTrendChart data={analytics.completionTrend} />}
                      </ChartCard>
                    </SectionErrorBoundary>

                    <SectionErrorBoundary>
                      <ChartCard
                        title="Condiciones"
                        description="Distribución de inspecciones"
                        isLoading={false}
                        isEmpty={!analytics?.conditionDistribution.length}
                        emptyIcon={<PieChart className="h-8 w-8" />}
                        height={280}
                      >
                        {analytics && (
                          <ConditionDonutChart data={analytics.conditionDistribution} />
                        )}
                      </ChartCard>
                    </SectionErrorBoundary>
                  </div>

                  <SectionErrorBoundary>
                    <ChartCard
                      title="Categorías Problemáticas"
                      description="Top 5 por incidencias"
                      isLoading={false}
                      isEmpty={!analytics?.problematicCategories.length}
                      emptyIcon={<BarChart3 className="h-8 w-8" />}
                      height={280}
                      href="/categories"
                    >
                      {analytics && (
                        <ProblematicCategoriesChart data={analytics.problematicCategories} />
                      )}
                    </ChartCard>
                  </SectionErrorBoundary>
                </div>
              ))}
          </TabsContent>

          {/* Tendencias tab */}
          <TabsContent value="trends">
            {analyticsTab === 'trends' &&
              (analyticsLoading ? (
                <div className="space-y-6">
                  <SkeletonShimmer className="h-[300px] w-full" />
                  <SkeletonShimmer className="h-[200px] w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <SectionErrorBoundary>
                    <ChartCard
                      title="Costos por Categoría"
                      description={`Últimos ${chartMonths} meses`}
                      isLoading={false}
                      isEmpty={
                        !analytics?.categoryCosts.some((c) => Object.keys(c.categories).length > 0)
                      }
                      emptyIcon={<DollarSign className="h-8 w-8" />}
                      height={300}
                      href="/tasks"
                    >
                      {analytics && <CategoryCostsChart data={analytics.categoryCosts} />}
                    </ChartCard>
                  </SectionErrorBoundary>

                  {/* Portfolio Health */}
                  {analytics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="type-title-md">Salud del Portfolio</CardTitle>
                        <p className="type-body-sm text-muted-foreground">
                          Índice basado en tareas vencidas vs completadas
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div
                            className={`type-number-md ${
                              analytics.completionRate >= 80
                                ? 'text-success'
                                : analytics.completionRate >= 60
                                  ? 'text-amber-600'
                                  : 'text-destructive'
                            }`}
                          >
                            {analytics.completionRate}%
                          </div>
                          <div className="flex-1">
                            <div className="bg-muted h-2 overflow-hidden rounded-full">
                              <div
                                className={`h-full rounded-full ${
                                  analytics.completionRate >= 80
                                    ? 'bg-success'
                                    : analytics.completionRate >= 60
                                      ? 'bg-amber-500'
                                      : 'bg-destructive'
                                }`}
                                style={{ width: `${analytics.completionRate}%` }}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">
                              Tasa de completamiento global de tareas
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Problematic Sectors */}
                  {analytics && analytics.problematicSectors?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="type-title-md">Sectores Problemáticos</CardTitle>
                        <p className="type-body-sm text-muted-foreground">
                          Top sectores con más tareas vencidas
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.problematicSectors.map((s) => {
                            const label =
                              PROPERTY_SECTOR_LABELS[s.sector as PropertySector] ?? s.sector;
                            return (
                              <div key={s.sector} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{label}</span>
                                <Badge variant="destructive" className="text-xs">
                                  {s.overdueCount} vencida{s.overdueCount !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
          </TabsContent>

          {/* Financiero tab */}
          <TabsContent value="financial">
            {analyticsTab === 'financial' &&
              (analyticsLoading ? (
                <div className="space-y-6">
                  <SkeletonShimmer className="h-[300px] w-full" />
                  <SkeletonShimmer className="h-[200px] w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <SectionErrorBoundary>
                    <ChartCard
                      title="Pipeline de Presupuestos"
                      description="Por estado"
                      isLoading={false}
                      isEmpty={!analytics?.budgetPipeline.length}
                      emptyIcon={<FileText className="h-8 w-8" />}
                      height={280}
                      href="/budgets"
                    >
                      {analytics && <BudgetPipelineChart data={analytics.budgetPipeline} />}
                    </ChartCard>
                  </SectionErrorBoundary>

                  {/* Key Metrics */}
                  {analytics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="type-title-md">Métricas Clave</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-lg p-2.5">
                              <DollarSign className="text-primary h-5 w-5" />
                            </div>
                            <div>
                              <p className="type-body-sm text-muted-foreground">
                                Costo total mantenimiento
                              </p>
                              <p className="type-number-md text-foreground">
                                {formatCurrency(analytics.totalMaintenanceCost)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-lg p-2.5">
                              <Timer className="text-primary h-5 w-5" />
                            </div>
                            <div>
                              <p className="type-body-sm text-muted-foreground">
                                Respuesta promedio presupuestos
                              </p>
                              <p className="type-number-md text-foreground">
                                {analytics.avgBudgetResponseDays !== null
                                  ? `${analytics.avgBudgetResponseDays} días`
                                  : 'Sin datos'}
                              </p>
                            </div>
                          </div>

                          {analytics.slaMetrics.avgResponseHours !== null && (
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 rounded-lg p-2.5">
                                <Timer className="text-primary h-5 w-5" />
                              </div>
                              <div>
                                <p className="type-body-sm text-muted-foreground">
                                  Tiempo respuesta solicitudes
                                </p>
                                <p
                                  className={`type-number-md ${
                                    analytics.slaMetrics.avgResponseHours <= 24
                                      ? 'text-success'
                                      : analytics.slaMetrics.avgResponseHours <= 72
                                        ? 'text-amber-600'
                                        : 'text-destructive'
                                  }`}
                                >
                                  {analytics.slaMetrics.avgResponseHours}h
                                </p>
                              </div>
                            </div>
                          )}

                          {analytics.slaMetrics.avgResolutionHours !== null && (
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 rounded-lg p-2.5">
                                <Timer className="text-primary h-5 w-5" />
                              </div>
                              <div>
                                <p className="type-body-sm text-muted-foreground">
                                  Tiempo resolución solicitudes
                                </p>
                                <p
                                  className={`type-number-md ${
                                    analytics.slaMetrics.avgResolutionHours <= 48
                                      ? 'text-success'
                                      : analytics.slaMetrics.avgResolutionHours <= 168
                                        ? 'text-amber-600'
                                        : 'text-destructive'
                                  }`}
                                >
                                  {analytics.slaMetrics.avgResolutionHours}h
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Level 4: Activity Feed */}
      <motion.div
        className="mt-6"
        {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
      >
        <Card>
          <CardHeader>
            <CardTitle className="type-title-md">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div role="status" aria-label="Cargando..." className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonShimmer key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : activityError ? (
              <ErrorState
                message="No se pudo cargar la actividad reciente"
                onRetry={refetchActivity}
              />
            ) : activity && activity.length > 0 ? (
              <Wrapper
                className="space-y-3"
                {...(shouldAnimate
                  ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
                  : {})}
              >
                <ul className="space-y-3">
                  {activity.map((item) => {
                    const href = getActivityHref(item);
                    const content = (
                      <li
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3',
                          href && 'hover:bg-accent cursor-pointer transition-colors',
                        )}
                      >
                        <div className="bg-muted mt-0.5 rounded-full p-2">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.description}</span>
                          <span className="text-muted-foreground mt-0.5 block text-xs">
                            {formatRelativeDate(new Date(item.timestamp))}
                          </span>
                        </div>
                      </li>
                    );

                    return (
                      <Item key={item.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                        {href ? (
                          <Link href={href} className="no-underline">
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </Item>
                    );
                  })}
                </ul>
              </Wrapper>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Activity className="text-muted-foreground/60 h-8 w-8" />
                <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
