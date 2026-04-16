'use client';

import { DAILY_TIPS, QUERY_KEYS, WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ActionList } from '@/components/action-list';

/* Recharts deferred — AnalyticsTabs only loaded when user clicks "Ver estadísticas" */
const AnalyticsTabs = dynamic(
  () => import('@/components/analytics-tabs').then((m) => m.AnalyticsTabs),
  { ssr: false },
);
import { ErrorState } from '@/components/error-state';
import { HomeStatusCard } from '@/components/home-status-card';
import { DashboardTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { WeeklyChallengeCard } from '@/components/weekly-challenge-card';
import { WelcomeCard } from '@/components/welcome-card';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { useStreakFreeze } from '@/hooks/use-milestones';
import { getClientAnalytics } from '@/lib/api/dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

function SubscriptionWarningBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user?.subscriptionExpiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (24 * 60 * 60_000),
  );
  if (daysLeft > 7) return null;

  return (
    <div
      role="alert"
      className="border-warning/30 bg-warning/5 mb-4 flex items-center gap-3 rounded-lg border p-3"
    >
      <AlertTriangle className="text-warning h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="type-body-sm text-foreground font-medium">
          Tu suscripción vence{' '}
          {daysLeft <= 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`}
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 type-body-sm font-medium"
        >
          Contactar para renovar →
        </a>
      </div>
    </div>
  );
}

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
  const streakFreeze = useStreakFreeze();
  const motivationStyle = useUiPreferencesStore((s) => s.motivationStyle);
  // `motivationStyle` reads localStorage synchronously at module load, so SSR
  // sees the default while the client sees the persisted value. Gate any
  // UI that depends on it behind a `mounted` flag to avoid hydration mismatch
  // on the conditional rendering of WeeklyChallengeCard below.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const showRewards = mounted && motivationStyle === 'rewards';

  // Calculate tip index on client only to avoid hydration mismatch and stale SSR cache
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
    setTipIndex(daysSinceEpoch % DAILY_TIPS.length);
  }, []);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // Defer analytics fetch until user expands the section
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics, chartMonths],
    queryFn: ({ signal }) => getClientAnalytics(signal, chartMonths).then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled: showAnalytics,
  });

  // First non-overdue upcoming task = "Próxima inspección"
  const nextUpcoming = useMemo(() => {
    if (!upcoming) return null;
    const now = Date.now();
    return upcoming.find((t) => t.nextDueDate && new Date(t.nextDueDate).getTime() >= now) ?? null;
  }, [upcoming]);

  const actionsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Show welcome card until client has properties with active tasks
  const hasTasks =
    (stats?.pendingTasks ?? 0) + (stats?.overdueTasks ?? 0) + (stats?.upcomingTasks ?? 0) > 0;
  const showWelcome = stats && (stats.totalProperties === 0 || !hasTasks);

  const score = stats?.healthScore ?? 0;
  const label = stats?.healthLabel ?? '';

  return (
    <div>
      {!showWelcome && stats && <DashboardTour />}
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

      <p className="text-muted-foreground mb-3 text-xs">
        Panel de propietario — gestioná tus propiedades, tareas y presupuestos de mantenimiento.
      </p>

      <SubscriptionWarningBanner />

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
      <div className="mb-6" aria-live="polite">
        {statsLoading ? (
          <div role="status" aria-label="Cargando...">
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-64" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 flex-1" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-36" />
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2 text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                      <Skeleton className="mx-auto h-5 w-8" />
                      <Skeleton className="mx-auto h-3 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : statsError ? (
          <ErrorState
            message="No se pudieron cargar las estadísticas"
            onRetry={refetchStats}
            severity="critical"
          />
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
            isvDelta={stats.isvDelta}
            streak={stats.streak}
            perfectWeek={stats.perfectWeek}
            onViewActions={() => scrollTo(actionsRef)}
            onViewAnalytics={() => scrollTo(analyticsRef)}
            onStreakFreeze={() => streakFreeze.mutate()}
          />
        ) : null}
      </div>

      {/* Tip of the day */}
      <div className="bg-muted/50 border-border/60 mb-4 flex items-start gap-2.5 rounded-lg border px-4 py-3">
        <span className="mt-0.5 shrink-0 text-sm">💡</span>
        <div className="min-w-0">
          <p className="type-label-sm text-muted-foreground mb-0.5 font-medium tracking-wider uppercase">
            Tip del día
          </p>
          <p className="type-body-sm text-foreground/80">{DAILY_TIPS[tipIndex]}</p>
        </div>
      </div>

      {/* Level 2: Action List — most important, right after status */}
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
          <ActionList tasks={upcoming} nextUpcoming={nextUpcoming} />
        ) : null}
      </div>

      {/* Weekly challenge — after action list, before analytics. Hidden in 'minimal' motivation style. */}
      {!showWelcome && showRewards && (
        <div className="mb-6">
          <WeeklyChallengeCard />
        </div>
      )}

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
