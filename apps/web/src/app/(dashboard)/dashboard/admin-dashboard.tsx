'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { AttentionNeeded } from '@/components/attention-needed';
import { ErrorState } from '@/components/error-state';
import { AdminDashboardTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminActivity, useAdminAnalytics, useAdminDashboardStats } from '@/hooks/use-dashboard';
import { FADE_IN_UP, useMotionPreference } from '@/lib/motion';

import { ActivityFeed } from './components/activity-feed';
import { FinancialTab } from './components/financial-tab';
import { KpiSummaryCard } from './components/kpi-summary-card';
import { MonthSelector } from './components/month-selector';
import { OperationalTab } from './components/operational-tab';
import { TrendsTab } from './components/trends-tab';

export function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useAdminDashboardStats();
  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useAdminActivity();
  const [chartMonths, setChartMonths] = useState(6);
  const [analyticsTab, setAnalyticsTab] = useState('operational');
  // Defer analytics fetch until after stats + activity render (reduces FCP by ~2s)
  const [showAnalytics, setShowAnalytics] = useState(false);
  useEffect(() => {
    setShowAnalytics(true);
  }, []);
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics(
    showAnalytics ? chartMonths : undefined,
  );
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <AdminDashboardTour />
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      <p className="text-muted-foreground mb-3 text-xs">
        Panel de administración EPDE — gestión de clientes, propiedades y cotizaciones.
      </p>

      {/* Level 1: Executive summary KPIs */}
      <div data-tour="admin-kpis" className="mb-6">
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
            <KpiSummaryCard stats={stats} analytics={analytics} />
          </Wrapper>
        ) : null}
      </div>

      {/* Level 2: Attention Needed */}
      <div data-tour="admin-attention" className="mb-6">
        {stats && <AttentionNeeded stats={stats} />}
      </div>

      {/* Level 3: Admin Analytics Tabs */}
      <div data-tour="admin-tabs" className="mb-6">
        <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="operational">Operativo</TabsTrigger>
              <TabsTrigger value="trends">Tendencias</TabsTrigger>
              <TabsTrigger value="financial">Financiero</TabsTrigger>
            </TabsList>
            <MonthSelector chartMonths={chartMonths} onChange={setChartMonths} />
          </div>

          <TabsContent value="operational">
            {analyticsTab === 'operational' && (
              <OperationalTab
                analytics={analytics}
                analyticsLoading={analyticsLoading}
                chartMonths={chartMonths}
              />
            )}
          </TabsContent>

          <TabsContent value="trends">
            {analyticsTab === 'trends' && (
              <TrendsTab
                analytics={analytics}
                analyticsLoading={analyticsLoading}
                chartMonths={chartMonths}
              />
            )}
          </TabsContent>

          <TabsContent value="financial">
            {analyticsTab === 'financial' && (
              <FinancialTab analytics={analytics} analyticsLoading={analyticsLoading} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Level 4: Activity Feed */}
      <div data-tour="admin-activity">
        <ActivityFeed
          activity={activity}
          activityLoading={activityLoading}
          activityError={activityError}
          refetchActivity={refetchActivity}
          shouldAnimate={shouldAnimate}
        />
      </div>
    </div>
  );
}
