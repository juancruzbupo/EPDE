import { DAILY_TIPS, formatRelativeDate, UserRole, WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ActionList } from '@/components/action-list';
import { AnalyticsSection } from '@/components/analytics-section';
import { ErrorState } from '@/components/error-state';
import { FirstTimeBanner } from '@/components/first-time-banner';
import { HomeStatusCard } from '@/components/home-status-card';
import { MonthlySummaryCard } from '@/components/monthly-summary-card';
import { OnboardingCarousel, useOnboardingState } from '@/components/onboarding-carousel';
import { PropertyPicker } from '@/components/property-picker';
import { ProtectedHomeBanner } from '@/components/protected-home-banner';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { StreakCard } from '@/components/streak-card';
import { WelcomeCard } from '@/components/welcome-card';
import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '@/hooks/use-dashboard';
import { useStreakFreeze } from '@/hooks/use-milestones';
import { COLORS } from '@/lib/colors';
import { useType } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { ROUTES } from '@/lib/routes';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardScreen() {
  const userRole = useAuthStore((s) => s.user?.role);
  const TYPE = useType();

  if (userRole === UserRole.ADMIN) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-6">
        <Text style={TYPE.displayLg} className="text-foreground text-center">
          Panel de Administración
        </Text>
        <Text style={TYPE.bodyMd} className="text-muted-foreground mt-3 text-center">
          La administración de EPDE se realiza desde la versión web.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Abrir panel de administración web"
          onPress={() => {
            haptics.light();
            void Linking.openURL('https://epde.com.ar/dashboard');
          }}
          className="mt-6 rounded-xl px-6 py-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text style={TYPE.titleSm} className="text-center text-white">
            Abrir panel web
          </Text>
        </Pressable>
      </View>
    );
  }

  return <ClientDashboard />;
}

function ClientDashboard() {
  const [showOnboarding, onboardingDismiss] = useOnboardingState();
  const router = useRouter();
  const TYPE = useType();
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? '';
  const [chartMonths, setChartMonths] = useState<number | undefined>(undefined);
  const streakFreeze = useStreakFreeze();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    dataUpdatedAt,
  } = useClientDashboardStats();

  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useClientUpcomingTasks();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useClientAnalytics(chartMonths);

  const isLoading = statsLoading || tasksLoading;

  const subscriptionDaysLeft = useMemo(() => {
    if (!user?.subscriptionExpiresAt) return null;
    return Math.ceil(
      (new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (24 * 60 * 60_000),
    );
  }, [user?.subscriptionExpiresAt]);

  // First non-overdue task = "Próxima inspección"
  const nextUpcoming = useMemo(() => {
    if (!tasks) return null;
    const now = Date.now();
    return tasks.find((t) => t.nextDueDate && new Date(t.nextDueDate).getTime() >= now) ?? null;
  }, [tasks]);

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchTasks();
    refetchAnalytics();
  }, [refetchStats, refetchTasks, refetchAnalytics]);

  // Notify when a refresh fails but cached data is still shown (m7)
  const wasRefreshingRef = useRef(false);
  useEffect(() => {
    if (isLoading) {
      wasRefreshingRef.current = true;
    } else if (wasRefreshingRef.current) {
      wasRefreshingRef.current = false;
      const hasCachedData = !!stats || !!tasks;
      if ((statsError || tasksError) && hasCachedData) {
        Alert.alert(
          'Sin conexión',
          'No se pudo actualizar. Mostrando datos guardados.',
          [{ text: 'OK' }],
          { cancelable: true },
        );
      }
    }
  }, [isLoading, statsError, tasksError, stats, tasks]);

  // ISV improvement narrative — toast cuando el ISV subió ≥3 puntos.
  // Ref guard protege contra re-toast en la misma sesión (pull-to-refresh);
  // AsyncStorage con TTL 24h protege contra re-toast en sesiones nuevas
  // durante el mismo día (Mariana 38 abre la app 5× al día — el toast
  // perdía valor celebratorio al repetirse).
  const isvToastFiredRef = useRef(false);
  useEffect(() => {
    if (!stats?.isvDelta || stats.isvDelta < 3 || isvToastFiredRef.current) return;

    const key = `isv-toast:${stats.isvDelta}:${stats.healthScore ?? 0}`;
    const TTL_MS = 24 * 60 * 60_000;

    void (async () => {
      try {
        const lastShownAt = await AsyncStorage.getItem(key);
        if (lastShownAt && Date.now() - Number(lastShownAt) < TTL_MS) return;
        isvToastFiredRef.current = true;
        const score = stats.healthScore ?? 0;
        const delta = stats.isvDelta ?? 0;
        const projection = Math.min(100, score + delta * 3);
        toast.success(
          `Tu ISV subió ${delta} puntos. Mantené el ritmo y en 3 meses podrías llegar a ${projection}.`,
          6000,
        );
        await AsyncStorage.setItem(key, String(Date.now()));
      } catch {
        // AsyncStorage puede fallar; fallback: usar solo el ref guard.
        if (!isvToastFiredRef.current) {
          isvToastFiredRef.current = true;
          const score = stats.healthScore ?? 0;
          const delta = stats.isvDelta ?? 0;
          const projection = Math.min(100, score + delta * 3);
          toast.success(
            `Tu ISV subió ${delta} puntos. Mantené el ritmo y en 3 meses podrías llegar a ${projection}.`,
            6000,
          );
        }
      }
    })();
  }, [stats?.isvDelta, stats?.healthScore]);

  // Show welcome card until client has properties with active tasks
  const hasTasks =
    (stats?.pendingTasks ?? 0) + (stats?.overdueTasks ?? 0) + (stats?.upcomingTasks ?? 0) > 0;
  const showWelcome = stats && (stats.totalProperties === 0 || !hasTasks);

  const handleServiceRequests = () => {
    haptics.light();
    router.push(ROUTES.serviceRequests as never);
  };

  const handleBudgets = () => {
    haptics.light();
    router.push(ROUTES.budgets as never);
  };

  if ((statsError || tasksError) && !stats && !tasks) {
    return <ErrorState onRetry={onRefresh} message="No se pudieron cargar los datos del panel." />;
  }

  if (showOnboarding) {
    return <OnboardingCarousel onDone={onboardingDismiss} />;
  }
  if (showOnboarding === null) return null;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
    >
      {/* Title */}
      <Text style={TYPE.displayLg} className="text-foreground">
        {userName ? `Hola, ${userName.split(' ')[0]}` : 'Mi Panel'}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
        Resumen de tus propiedades y tareas
      </Text>
      {dataUpdatedAt > 0 && (
        <Text style={TYPE.bodySm} className="text-muted-foreground mb-4">
          Actualizado {formatRelativeDate(new Date(dataUpdatedAt))}
        </Text>
      )}

      {/* Subscription warning */}
      {subscriptionDaysLeft !== null && subscriptionDaysLeft <= 7 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tu suscripción está por vencer. Toca para renovar."
          className="border-warning/30 bg-warning/5 mb-4 flex-row items-center gap-3 rounded-xl border p-3"
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
            )
          }
        >
          <Text style={{ fontSize: 20 }}>⚠️</Text>
          <View className="flex-1">
            <Text style={TYPE.bodySm} className="text-foreground font-medium">
              Tu suscripción vence{' '}
              {subscriptionDaysLeft <= 0
                ? 'hoy'
                : subscriptionDaysLeft === 1
                  ? 'mañana'
                  : `en ${subscriptionDaysLeft} días`}
            </Text>
            <Text style={TYPE.bodySm} className="text-primary">
              Contactar para renovar →
            </Text>
          </View>
        </Pressable>
      )}

      {/* Welcome Card — shown until client has tasks */}
      {showWelcome && (
        <WelcomeCard
          userName={userName}
          hasProperties={(stats?.totalProperties ?? 0) > 0}
          hasActivePlan={hasTasks}
          hasCompletedTasks={(stats?.completedThisMonth ?? 0) > 0}
        />
      )}

      {/* Level 1: Home Status — conclusion first */}
      {statsLoading && !stats ? (
        <View className="mb-4">
          <StatCardSkeleton />
          <View className="mt-3 flex-row gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
        </View>
      ) : stats && !showWelcome ? (
        <>
          <FirstTimeBanner
            id="dashboard-isv-intro"
            emoji="👋"
            title="Lo importante arriba"
            message="El puntaje que ves es el Índice de Salud (ISV) de tus propiedades — del 0 al 100, más alto es mejor. Abajo van las tareas que más urge atender."
          />
          {/* Property picker — solo visible con 2+ propiedades (Jorge inversor).
              El componente se auto-oculta cuando hay 0-1 propiedades. */}
          <PropertyPicker />
          <HomeStatusCard
            score={stats.healthScore ?? 0}
            label={stats.healthLabel ?? ''}
            overdueTasks={stats.overdueTasks}
            upcomingThisWeek={stats.upcomingThisWeek}
            urgentTasks={stats.urgentTasks}
            pendingTasks={stats.pendingTasks}
            completedThisMonth={stats.completedThisMonth}
            pendingBudgets={stats.pendingBudgets}
            isvDelta={stats.isvDelta}
            streak={stats.streak}
            perfectWeek={stats.perfectWeek}
          />
        </>
      ) : null}

      {/* All-clear status — relief dopamine, not celebration */}
      {stats && !showWelcome && (
        <ProtectedHomeBanner overdueTasks={stats.overdueTasks} urgentTasks={stats.urgentTasks} />
      )}

      {/* Monthly summary — professional management report tone */}
      {stats && !showWelcome && (
        <MonthlySummaryCard
          completedThisMonth={stats.completedThisMonth}
          isvDelta={stats.isvDelta}
          healthScore={stats.healthScore ?? 0}
          streak={stats.streak ?? 0}
        />
      )}

      {/* Streak & perfect week — prominent section */}
      {stats && !showWelcome && (
        <StreakCard
          streak={stats.streak ?? 0}
          perfectWeek={stats.perfectWeek ?? false}
          onFreeze={() => streakFreeze.mutate()}
          freezePending={streakFreeze.isPending}
        />
      )}

      {/* Level 2: Actions — what to do next */}
      {tasksLoading && !tasks ? (
        <View className="mb-4">
          <StatCardSkeleton />
          <View className="mt-3">
            <StatCardSkeleton />
          </View>
        </View>
      ) : tasks && !showWelcome ? (
        <ActionList tasks={tasks} nextUpcoming={nextUpcoming} />
      ) : null}

      {/* Tip of the day */}
      <View className="border-primary/10 bg-primary/[0.03] mb-4 rounded-xl border p-3">
        <Text style={TYPE.labelSm} className="text-primary mb-1 font-medium">
          Tip del día
        </Text>
        <Text style={TYPE.bodySm} className="text-foreground/80">
          {DAILY_TIPS[Math.floor(Date.now() / 86_400_000) % DAILY_TIPS.length] ?? DAILY_TIPS[0]}
        </Text>
      </View>

      {/* Quick access cards */}
      <View className="mb-4 gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Solicitudes de Servicio"
          onPress={handleServiceRequests}
          className="border-border bg-card flex-row items-center justify-between rounded-xl border p-3"
        >
          <View>
            <Text style={TYPE.titleSm} className="text-foreground">
              Solicitudes de Servicio
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Reportar problemas o pedir asistencia
            </Text>
          </View>
          <Text className="text-muted-foreground" style={TYPE.titleSm}>
            &gt;
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Presupuestos"
          onPress={handleBudgets}
          className="border-border bg-card flex-row items-center justify-between rounded-xl border p-3"
        >
          <View>
            <Text style={TYPE.titleSm} className="text-foreground">
              Presupuestos
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Solicitar cotizaciones para reparaciones
            </Text>
          </View>
          <Text className="text-muted-foreground" style={TYPE.titleSm}>
            &gt;
          </Text>
        </Pressable>
      </View>

      {/* Level 3: Analytics — collapsed by default */}
      {!showWelcome && (
        <AnalyticsSection
          analytics={analytics}
          isLoading={analyticsLoading}
          chartMonths={chartMonths}
          onMonthsChange={setChartMonths}
        />
      )}
    </ScrollView>
  );
}
