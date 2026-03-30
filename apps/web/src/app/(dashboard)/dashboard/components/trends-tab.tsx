import type { AdminAnalytics, PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import { DollarSign } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { ChartCard } from '@/components/charts/chart-card';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';

const CategoryCostsChart = dynamic(
  () => import('@/components/charts/category-costs-chart').then((m) => m.CategoryCostsChart),
  { ssr: false },
);

interface TrendsTabProps {
  analytics: AdminAnalytics | undefined;
  analyticsLoading: boolean;
  chartMonths: number;
}

export const TrendsTab = React.memo(function TrendsTab({
  analytics,
  analyticsLoading,
  chartMonths,
}: TrendsTabProps) {
  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonShimmer className="h-[300px] w-full" />
        <SkeletonShimmer className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionErrorBoundary>
        <ChartCard
          title="Costos por Categoría"
          description={`Últimos ${chartMonths} meses`}
          isLoading={false}
          isEmpty={!analytics?.categoryCosts.some((c) => Object.keys(c.categories).length > 0)}
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
                      ? 'text-warning'
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
                          ? 'bg-warning'
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
                const label = PROPERTY_SECTOR_LABELS[s.sector as PropertySector] ?? s.sector;
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
  );
});
