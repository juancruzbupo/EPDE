'use client';

import type { ActivityItem } from '@epde/shared';
import { ActivityType, formatARSCompact, formatRelativeDate } from '@epde/shared';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  DollarSign,
  FileText,
  Home,
  PieChart,
  Timer,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

import { BudgetPipelineChart } from '@/components/charts/budget-pipeline-chart';
import { CategoryCostsChart } from '@/components/charts/category-costs-chart';
import { ChartCard } from '@/components/charts/chart-card';
import { CompletionTrendChart } from '@/components/charts/completion-trend-chart';
import { ConditionDonutChart } from '@/components/charts/condition-donut-chart';
import { ProblematicCategoriesChart } from '@/components/charts/problematic-categories-chart';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { StatCard } from '@/components/stat-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { useAdminAnalytics, useDashboardActivity, useDashboardStats } from '@/hooks/use-dashboard';
import { FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

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
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      {/* Row 1 — KPI Stats */}
      <Wrapper
        key={statsLoading ? 'loading' : 'loaded'}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        {...(shouldAnimate
          ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
          : {})}
      >
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Item key={`skel-${i}`} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <Card>
                <CardContent className="p-6">
                  <SkeletonShimmer className="h-20 w-full" />
                </CardContent>
              </Card>
            </Item>
          ))
        ) : statsError ? (
          <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
            <ErrorState
              message="No se pudieron cargar las estadísticas"
              onRetry={refetchStats}
              className="col-span-full"
            />
          </Item>
        ) : stats ? (
          <>
            <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <StatCard
                title="Clientes"
                value={<AnimatedNumber value={stats.totalClients} />}
                icon={Users}
              />
            </Item>
            <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <StatCard
                title="Propiedades"
                value={<AnimatedNumber value={stats.totalProperties} />}
                icon={Home}
              />
            </Item>
            <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <StatCard
                title="Tareas Vencidas"
                value={<AnimatedNumber value={stats.overdueTasks} />}
                icon={AlertTriangle}
                className={stats.overdueTasks > 0 ? 'border-destructive/30 bg-destructive/10' : ''}
              />
            </Item>
            <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <StatCard
                title="Presupuestos"
                value={<AnimatedNumber value={stats.pendingBudgets} />}
                icon={FileText}
              />
            </Item>
            <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
              <StatCard
                title="Servicios"
                value={<AnimatedNumber value={stats.pendingServices} />}
                icon={Wrench}
              />
            </Item>
          </>
        ) : null}
      </Wrapper>

      {/* Acciones Rápidas */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          href="/budgets?status=PENDING"
          className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
        >
          <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Presupuestos por responder</span>
        </Link>
        <Link
          href="/service-requests?status=OPEN"
          className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
        >
          <Wrench className="text-muted-foreground h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Servicios abiertos</span>
        </Link>
        <Link
          href="/clients?status=INVITED"
          className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
        >
          <Users className="text-muted-foreground h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Clientes por activar</span>
        </Link>
      </div>

      {/* Row 2 — Completion Trend + Condition Distribution */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionErrorBoundary>
          <ChartCard
            title="Tareas Completadas"
            description="Últimos 6 meses"
            className="lg:col-span-2"
            isLoading={analyticsLoading}
            isEmpty={!analytics?.completionTrend.length}
            emptyIcon={<TrendingUp className="h-8 w-8" />}
            height={280}
          >
            {analytics && <CompletionTrendChart data={analytics.completionTrend} />}
          </ChartCard>
        </SectionErrorBoundary>

        <SectionErrorBoundary>
          <ChartCard
            title="Condiciones"
            description="Distribución de inspecciones"
            isLoading={analyticsLoading}
            isEmpty={!analytics?.conditionDistribution.length}
            emptyIcon={<PieChart className="h-8 w-8" />}
            height={280}
          >
            {analytics && <ConditionDonutChart data={analytics.conditionDistribution} />}
          </ChartCard>
        </SectionErrorBoundary>
      </div>

      {/* Row 3 — Categorías + Pipeline + Métricas */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionErrorBoundary>
          <ChartCard
            title="Categorías Problemáticas"
            description="Top 5 por incidencias"
            isLoading={analyticsLoading}
            isEmpty={!analytics?.problematicCategories.length}
            emptyIcon={<BarChart3 className="h-8 w-8" />}
            height={280}
          >
            {analytics && <ProblematicCategoriesChart data={analytics.problematicCategories} />}
          </ChartCard>
        </SectionErrorBoundary>

        <SectionErrorBoundary>
          <ChartCard
            title="Pipeline de Presupuestos"
            description="Por estado"
            isLoading={analyticsLoading}
            isEmpty={!analytics?.budgetPipeline.length}
            emptyIcon={<FileText className="h-8 w-8" />}
            height={280}
          >
            {analytics && <BudgetPipelineChart data={analytics.budgetPipeline} />}
          </ChartCard>
        </SectionErrorBoundary>

        <ChartCard title="Métricas Clave" isLoading={analyticsLoading} isEmpty={false} height={280}>
          {analytics && (
            <div className="flex h-full flex-col justify-center gap-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2.5">
                  <DollarSign className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="type-body-sm text-muted-foreground">Costo total mantenimiento</p>
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
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2.5">
                  <TrendingUp className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="type-body-sm text-muted-foreground">Tasa de completamiento</p>
                  <p className="type-number-md text-foreground">{analytics.completionRate}%</p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 4 — Category Costs */}
      <div className="mt-6">
        <SectionErrorBoundary>
          <ChartCard
            title="Costos por Categoría"
            description="Últimos 6 meses"
            isLoading={analyticsLoading}
            isEmpty={!analytics?.categoryCosts.some((c) => Object.keys(c.categories).length > 0)}
            emptyIcon={<DollarSign className="h-8 w-8" />}
            height={300}
          >
            {analytics && <CategoryCostsChart data={analytics.categoryCosts} />}
          </ChartCard>
        </SectionErrorBoundary>
      </div>

      {/* Row 5 — Activity */}
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
              <div className="space-y-3">
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
                        className={`flex items-start gap-3 rounded-lg border p-3${href ? 'hover:bg-accent cursor-pointer transition-colors' : ''}`}
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
                <Activity className="text-muted-foreground/50 h-8 w-8" />
                <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
