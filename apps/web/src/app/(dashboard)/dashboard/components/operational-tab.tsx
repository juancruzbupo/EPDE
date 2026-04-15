import type { AdminAnalytics } from '@epde/shared';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { ChartCard } from '@/components/charts/chart-card';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { ROUTES } from '@/lib/routes';

const CompletionTrendChart = dynamic(
  () => import('@/components/charts/completion-trend-chart').then((m) => m.CompletionTrendChart),
  { ssr: false },
);
const ConditionDonutChart = dynamic(
  () => import('@/components/charts/condition-donut-chart').then((m) => m.ConditionDonutChart),
  { ssr: false },
);
const ProblematicCategoriesChart = dynamic(
  () =>
    import('@/components/charts/problematic-categories-chart').then(
      (m) => m.ProblematicCategoriesChart,
    ),
  { ssr: false },
);

interface OperationalTabProps {
  analytics: AdminAnalytics | undefined;
  analyticsLoading: boolean;
  chartMonths: number;
}

export const OperationalTab = React.memo(function OperationalTab({
  analytics,
  analyticsLoading,
  chartMonths,
}: OperationalTabProps) {
  if (analyticsLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonShimmer className="h-[300px] lg:col-span-2" />
        <SkeletonShimmer className="h-[300px]" />
      </div>
    );
  }

  return (
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
            href={ROUTES.tasks}
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
            {analytics && <ConditionDonutChart data={analytics.conditionDistribution} />}
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
          href={ROUTES.categories}
        >
          {analytics && <ProblematicCategoriesChart data={analytics.problematicCategories} />}
        </ChartCard>
      </SectionErrorBoundary>
    </div>
  );
});
