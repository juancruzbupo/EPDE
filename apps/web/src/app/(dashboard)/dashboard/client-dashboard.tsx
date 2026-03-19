'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import { ActionList } from '@/components/action-list';

const AnalyticsTabs = dynamic(
  () => import('@/components/analytics-tabs').then((m) => m.AnalyticsTabs),
  { ssr: false },
);
import { ErrorState } from '@/components/error-state';
import { HomeStatusCard } from '@/components/home-status-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { WelcomeCard } from '@/components/welcome-card';
import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '@/hooks/use-dashboard';

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { data: analytics, isLoading: analyticsLoading } = useClientAnalytics(chartMonths);

  const actionsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Show welcome card only for brand-new users with no properties yet
  const showWelcome = stats && stats.totalProperties === 0;

  const score = analytics?.healthIndex?.score ?? 0;
  const label = analytics?.healthIndex?.label ?? '';

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

      {/* Welcome Card — shown until client has first activity */}
      {showWelcome && (
        <WelcomeCard
          userName={userName}
          hasProperties={stats.totalProperties > 0}
          hasActivePlan={stats.pendingTasks + stats.overdueTasks + stats.upcomingTasks > 0}
          hasCompletedTasks={stats.completedThisMonth > 0}
        />
      )}

      {/* Level 1: Home Status Card */}
      <div className="mb-6">
        {statsLoading ? (
          <div role="status" aria-label="Cargando...">
            <Card>
              <CardContent className="p-6">
                <SkeletonShimmer className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : statsError ? (
          <ErrorState message="No se pudieron cargar las estadísticas" onRetry={refetchStats} />
        ) : stats ? (
          <HomeStatusCard
            score={score}
            label={label}
            overdueTasks={stats.overdueTasks}
            upcomingThisWeek={stats.upcomingThisWeek}
            urgentTasks={stats.urgentTasks}
            pendingTasks={stats.pendingTasks}
            completedThisMonth={stats.completedThisMonth}
            pendingBudgets={stats.pendingBudgets}
            onViewActions={() => scrollTo(actionsRef)}
            onViewAnalytics={() => scrollTo(analyticsRef)}
          />
        ) : null}
      </div>

      {/* Level 2: Action List */}
      <div ref={actionsRef} className="mb-6 scroll-mt-4">
        {upcomingLoading ? (
          <div role="status" aria-label="Cargando...">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonShimmer key={i} className="h-14 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : upcomingError ? (
          <ErrorState message="No se pudieron cargar las tareas" onRetry={refetchUpcoming} />
        ) : upcoming ? (
          <ActionList tasks={upcoming} />
        ) : null}
      </div>

      {/* Level 3: Analytics — collapsed by default to reduce cognitive load */}
      <div ref={analyticsRef} id="analytics" className="scroll-mt-4">
        {showAnalytics ? (
          <>
            <h2 className="type-title-lg text-foreground mb-4">Análisis completo</h2>
            <AnalyticsTabs
              analytics={analytics}
              healthIndex={analytics?.healthIndex}
              isLoading={analyticsLoading}
              chartMonths={chartMonths}
              onMonthsChange={setChartMonths}
            />
          </>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAnalytics(true)}>
            Ver estadísticas detalladas
          </Button>
        )}
      </div>
    </div>
  );
}
