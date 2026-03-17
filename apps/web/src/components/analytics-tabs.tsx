'use client';

import type { ClientAnalytics, PropertyHealthIndex } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, type PropertySector } from '@epde/shared';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { CategoryBreakdown } from '@/components/charts/category-breakdown';
import { ChartCard } from '@/components/charts/chart-card';
import { ConditionDonutChart } from '@/components/charts/condition-donut-chart';
import { ConditionTrendChart } from '@/components/charts/condition-trend-chart';
import { CostHistoryChart } from '@/components/charts/cost-history-chart';
import { HealthIndexCard } from '@/components/health-index-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsTabsProps {
  analytics: ClientAnalytics | undefined;
  healthIndex: PropertyHealthIndex | undefined;
  isLoading: boolean;
  chartMonths: number;
  onMonthsChange: (months: number) => void;
}

function MonthSelector({
  chartMonths,
  onMonthsChange,
}: {
  chartMonths: number;
  onMonthsChange: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="type-body-sm text-muted-foreground">Periodo:</span>
      {([3, 6, 12] as const).map((m) => (
        <button
          key={m}
          aria-label={`Mostrar últimos ${m} meses`}
          onClick={() => onMonthsChange(m)}
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

export function AnalyticsTabs({
  analytics,
  healthIndex,
  isLoading,
  chartMonths,
  onMonthsChange,
}: AnalyticsTabsProps) {
  return (
    <Tabs defaultValue="general">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="general">Estado general</TabsTrigger>
          <TabsTrigger value="evolution">Evolución</TabsTrigger>
          <TabsTrigger value="costs">Gastos</TabsTrigger>
          <TabsTrigger value="categories">Por categoría</TabsTrigger>
        </TabsList>
        <MonthSelector chartMonths={chartMonths} onMonthsChange={onMonthsChange} />
      </div>

      {/* Tab 1: Estado general */}
      <TabsContent value="general">
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonShimmer className="h-[300px] w-full" />
            <SkeletonShimmer className="h-[300px] w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Condición General"
              isLoading={false}
              isEmpty={!analytics?.conditionDistribution.length}
              emptyIcon={<PieChart className="h-8 w-8" />}
              height={240}
            >
              {analytics && <ConditionDonutChart data={analytics.conditionDistribution} />}
            </ChartCard>

            {healthIndex && healthIndex.score > 0 && <HealthIndexCard index={healthIndex} />}
          </div>
        )}
      </TabsContent>

      {/* Tab 2: Evolución */}
      <TabsContent value="evolution">
        {isLoading ? (
          <SkeletonShimmer className="h-[300px] w-full" />
        ) : (
          <ChartCard
            title="Evolución de Condición"
            description={`Promedio por categoría — últimos ${chartMonths} meses`}
            isLoading={false}
            isEmpty={!analytics?.conditionTrend.some((p) => Object.keys(p.categories).length > 0)}
            emptyIcon={<TrendingUp className="h-8 w-8" />}
            height={280}
          >
            {analytics && <ConditionTrendChart data={analytics.conditionTrend} />}
          </ChartCard>
        )}
      </TabsContent>

      {/* Tab 3: Gastos */}
      <TabsContent value="costs">
        {isLoading ? (
          <SkeletonShimmer className="h-[300px] w-full" />
        ) : (
          <div className="space-y-6">
            <ChartCard
              title="Historial de Gastos"
              description={`Últimos ${chartMonths} meses`}
              isLoading={false}
              isEmpty={!analytics?.costHistory.some((p) => p.value > 0)}
              emptyIcon={<BarChart3 className="h-8 w-8" />}
              height={280}
            >
              {analytics && <CostHistoryChart data={analytics.costHistory} />}
            </ChartCard>

            {analytics && analytics.costHistory.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2.5">
                      <BarChart3 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="type-body-sm text-muted-foreground">Costo total del periodo</p>
                      <p className="type-number-md text-foreground">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                          maximumFractionDigits: 0,
                        }).format(analytics.costHistory.reduce((sum, p) => sum + p.value, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      {/* Tab 4: Por categoría */}
      <TabsContent value="categories">
        {isLoading ? (
          <SkeletonShimmer className="h-[300px] w-full" />
        ) : (
          <div className="space-y-6">
            <ChartCard
              title="Estado por Categoría"
              isLoading={false}
              isEmpty={!analytics?.categoryBreakdown.length}
              emptyIcon={<BarChart3 className="h-8 w-8" />}
              emptyMessage="Sin categorías con tareas asignadas"
            >
              {analytics && <CategoryBreakdown data={analytics.categoryBreakdown} />}
            </ChartCard>

            {/* Sector breakdown */}
            {analytics && analytics.sectorBreakdown?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="type-title-md">Estado por Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {analytics.sectorBreakdown.map((s) => {
                      const label = PROPERTY_SECTOR_LABELS[s.sector as PropertySector] ?? s.sector;
                      const pctOk =
                        s.total > 0 ? Math.round(((s.total - s.overdue) / s.total) * 100) : 100;
                      return (
                        <Link
                          key={s.sector}
                          href={`/tasks?sector=${s.sector}`}
                          className="bg-muted/40 hover:bg-muted rounded-lg p-3 transition-colors"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">{label}</span>
                            <span
                              className={`text-xs font-medium ${
                                s.overdue > 0 ? 'text-destructive' : 'text-success'
                              }`}
                            >
                              {pctOk}%
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                            <div
                              className={`h-full rounded-full ${s.overdue > 0 ? 'bg-destructive' : 'bg-success'}`}
                              style={{ width: `${pctOk}%` }}
                            />
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {s.total} tarea{s.total !== 1 ? 's' : ''}
                            {s.overdue > 0
                              ? ` · ${s.overdue} vencida${s.overdue !== 1 ? 's' : ''}`
                              : ''}
                            {s.cost > 0 &&
                              ` · ${new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: 'ARS',
                                maximumFractionDigits: 0,
                              }).format(s.cost)}`}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
