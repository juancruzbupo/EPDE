import { formatRelativeDate, UserRole, WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ActionList } from '@/components/action-list';
import { AnalyticsSection } from '@/components/analytics-section';
import { ErrorState } from '@/components/error-state';
import { HomeStatusCard } from '@/components/home-status-card';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { WelcomeCard } from '@/components/welcome-card';
import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '@/hooks/use-dashboard';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardScreen() {
  const userRole = useAuthStore((s) => s.user?.role);

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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? '';
  const [chartMonths, setChartMonths] = useState<number | undefined>(undefined);

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

  // Show welcome card until client has properties with active tasks
  const hasTasks =
    (stats?.pendingTasks ?? 0) + (stats?.overdueTasks ?? 0) + (stats?.upcomingTasks ?? 0) > 0;
  const showWelcome = stats && (stats.totalProperties === 0 || !hasTasks);

  const handleServiceRequests = () => {
    haptics.light();
    router.push('/service-requests' as never);
  };

  const handleBudgets = () => {
    haptics.light();
    router.push('/budgets' as never);
  };

  if ((statsError || tasksError) && !stats && !tasks) {
    return <ErrorState onRetry={onRefresh} message="No se pudieron cargar los datos del panel." />;
  }

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
        <HomeStatusCard
          score={stats.healthScore ?? 0}
          label={stats.healthLabel ?? ''}
          overdueTasks={stats.overdueTasks}
          upcomingThisWeek={stats.upcomingThisWeek}
          urgentTasks={stats.urgentTasks}
          pendingTasks={stats.pendingTasks}
          completedThisMonth={stats.completedThisMonth}
          pendingBudgets={stats.pendingBudgets}
        />
      ) : null}

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
