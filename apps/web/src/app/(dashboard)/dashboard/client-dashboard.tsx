'use client';

import { formatRelativeDate, PRIORITY_VARIANT, TASK_PRIORITY_LABELS } from '@epde/shared';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  PieChart,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CategoryBreakdown } from '@/components/charts/category-breakdown';
import { ChartCard } from '@/components/charts/chart-card';
import { ConditionDonutChart } from '@/components/charts/condition-donut-chart';
import { ConditionTrendChart } from '@/components/charts/condition-trend-chart';
import { CostHistoryChart } from '@/components/charts/cost-history-chart';
import { ErrorState } from '@/components/error-state';
import { HealthCard } from '@/components/health-card';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '@/hooks/use-dashboard';
import { FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

export function ClientDashboard({ userName }: { userName: string }) {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useClientDashboardStats();
  const {
    data: upcoming,
    isLoading: upcomingLoading,
    isError: upcomingError,
    refetch: refetchUpcoming,
  } = useClientUpcomingTasks();
  const [chartMonths, setChartMonths] = useState(6);
  const { data: analytics, isLoading: analyticsLoading } = useClientAnalytics(chartMonths);
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

      {/* Row 1 — HealthCard */}
      {statsLoading ? (
        <div className="mb-4">
          <Card>
            <CardContent className="p-6">
              <SkeletonShimmer className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : stats ? (
        <div className="mb-4">
          <HealthCard
            totalTasks={stats.pendingTasks + stats.overdueTasks + stats.completedThisMonth}
            completedTasks={stats.completedThisMonth}
            overdueTasks={stats.overdueTasks}
          />
        </div>
      ) : null}

      {/* Row 2 — StatCards + Condition Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Wrapper
          key={statsLoading ? 'loading' : 'loaded'}
          className="grid gap-4 sm:grid-cols-2 lg:col-span-2"
          {...(shouldAnimate
            ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
            : {})}
        >
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
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
                  title="Tareas Pendientes"
                  value={<AnimatedNumber value={stats.pendingTasks} />}
                  icon={Clock}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                <StatCard
                  title="Tareas Vencidas"
                  value={<AnimatedNumber value={stats.overdueTasks} />}
                  icon={AlertTriangle}
                  className={
                    stats.overdueTasks > 0 ? 'border-destructive/30 bg-destructive/10' : ''
                  }
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
                  title="Servicios Abiertos"
                  value={<AnimatedNumber value={stats.openServices} />}
                  icon={Wrench}
                />
              </Item>
            </>
          ) : null}
        </Wrapper>

        <ChartCard
          title="Condición General"
          isLoading={analyticsLoading}
          isEmpty={!analytics?.conditionDistribution.length}
          emptyIcon={<PieChart className="h-8 w-8" />}
          height={240}
        >
          {analytics && <ConditionDonutChart data={analytics.conditionDistribution} />}
        </ChartCard>
      </div>

      {/* Time range selector */}
      <div className="mt-6 flex items-center gap-2">
        <span className="type-body-sm text-muted-foreground">Periodo:</span>
        {([3, 6, 12] as const).map((m) => (
          <button
            key={m}
            onClick={() => setChartMonths(m)}
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

      {/* Row 3 — Condition Trend + Cost History */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Evolución de Condición"
          description={`Promedio por categoría — últimos ${chartMonths} meses`}
          isLoading={analyticsLoading}
          isEmpty={!analytics?.conditionTrend.some((p) => Object.keys(p.categories).length > 0)}
          emptyIcon={<TrendingUp className="h-8 w-8" />}
          height={280}
        >
          {analytics && <ConditionTrendChart data={analytics.conditionTrend} />}
        </ChartCard>

        <ChartCard
          title="Historial de Gastos"
          description={`Últimos ${chartMonths} meses`}
          isLoading={analyticsLoading}
          isEmpty={!analytics?.costHistory.some((p) => p.value > 0)}
          emptyIcon={<BarChart3 className="h-8 w-8" />}
          height={280}
        >
          {analytics && <CostHistoryChart data={analytics.costHistory} />}
        </ChartCard>
      </div>

      {/* Row 4 — Category Breakdown */}
      <div className="mt-6">
        <ChartCard
          title="Estado por Categoría"
          isLoading={analyticsLoading}
          isEmpty={!analytics?.categoryBreakdown.length}
          emptyIcon={<BarChart3 className="h-8 w-8" />}
          emptyMessage="Sin categorías con tareas asignadas"
        >
          {analytics && <CategoryBreakdown data={analytics.categoryBreakdown} />}
        </ChartCard>
      </div>

      {/* Row 5 — Upcoming Tasks */}
      <motion.div
        className="mt-6"
        {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
      >
        <Card>
          <CardHeader>
            <CardTitle className="type-title-md">Próximas Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonShimmer key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : upcomingError ? (
              <ErrorState message="No se pudieron cargar las tareas" onRetry={refetchUpcoming} />
            ) : upcoming && upcoming.length > 0 ? (
              <Wrapper
                {...(shouldAnimate
                  ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
                  : {})}
              >
                <ul className="space-y-2">
                  {upcoming.map((task) => {
                    const isOverdue = task.nextDueDate
                      ? new Date(task.nextDueDate) < new Date()
                      : false;
                    return (
                      <Item key={task.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                        <li>
                          <Link
                            href={`/properties/${task.propertyId}?tab=plan`}
                            className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{task.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {task.categoryName}
                                </Badge>
                                <Badge
                                  variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
                                  className="text-xs"
                                >
                                  {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                                <span>{task.propertyAddress}</span>
                                <span>·</span>
                                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                                  {task.nextDueDate
                                    ? formatRelativeDate(new Date(task.nextDueDate))
                                    : 'Según detección'}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="text-muted-foreground h-4 w-4" />
                          </Link>
                        </li>
                      </Item>
                    );
                  })}
                </ul>
              </Wrapper>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle className="text-muted-foreground/50 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No tenés tareas próximas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
