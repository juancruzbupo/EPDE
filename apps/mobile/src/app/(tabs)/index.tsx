import { UserRole } from '@epde/shared';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ActionList } from '@/components/action-list';
import { AdminDashboard } from '@/components/admin-dashboard';
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
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardScreen() {
  const userRole = useAuthStore((s) => s.user?.role);

  if (userRole === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}

function ClientDashboard() {
  const router = useRouter();
  const userName = useAuthStore((s) => s.user?.name ?? '');
  const [chartMonths, setChartMonths] = useState(6);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
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

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchTasks();
    refetchAnalytics();
  }, [refetchStats, refetchTasks, refetchAnalytics]);

  // Show welcome card only for brand-new users with no properties yet
  const showWelcome = stats && stats.totalProperties === 0;

  const handleServiceRequests = () => {
    haptics.light();
    router.push('/service-requests' as never);
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
      <Text style={TYPE.displayLg} className="text-foreground mb-4">
        Mi Panel
      </Text>

      {/* Welcome Card — shown until client has tasks */}
      {showWelcome && (
        <WelcomeCard
          userName={userName}
          hasProperties={(stats?.totalProperties ?? 0) > 0}
          hasActivePlan={
            (stats?.pendingTasks ?? 0) + (stats?.overdueTasks ?? 0) + (stats?.upcomingTasks ?? 0) >
            0
          }
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
          score={analytics?.healthIndex?.score ?? 0}
          label={analytics?.healthIndex?.label ?? ''}
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
        <ActionList tasks={tasks} />
      ) : null}

      {/* Quick action: Service Requests */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Solicitudes de Servicio"
        onPress={handleServiceRequests}
        className="border-border bg-card mb-4 flex-row items-center justify-between rounded-xl border p-3"
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
