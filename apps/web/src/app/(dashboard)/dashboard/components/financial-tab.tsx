import type { AdminAnalytics } from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { DollarSign, FileText, Timer } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { ChartCard } from '@/components/charts/chart-card';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { ROUTES } from '@/lib/routes';

const BudgetPipelineChart = dynamic(
  () => import('@/components/charts/budget-pipeline-chart').then((m) => m.BudgetPipelineChart),
  { ssr: false },
);

const formatCurrency = (v: number) => formatARSCompact(v);

interface FinancialTabProps {
  analytics: AdminAnalytics | undefined;
  analyticsLoading: boolean;
}

export const FinancialTab = React.memo(function FinancialTab({
  analytics,
  analyticsLoading,
}: FinancialTabProps) {
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
          title="Pipeline de Presupuestos"
          description="Por estado"
          isLoading={false}
          isEmpty={!analytics?.budgetPipeline.length}
          emptyIcon={<FileText className="h-8 w-8" />}
          height={280}
          href={ROUTES.budgets}
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
                            ? 'text-warning'
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
                            ? 'text-warning'
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
  );
});
