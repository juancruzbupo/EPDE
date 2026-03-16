import type { UpcomingTask } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { AnimatedStatCard } from '@/components/animated-stat-card';
import { CategoryBreakdownList } from '@/components/charts/category-breakdown-list';
import { ChartCard } from '@/components/charts/chart-card';
import { MiniBarChart } from '@/components/charts/mini-bar-chart';
import { MiniDonutChart } from '@/components/charts/mini-donut-chart';
import { MiniTrendChart } from '@/components/charts/mini-trend-chart';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { HealthCard } from '@/components/health-card';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { PriorityBadge } from '@/components/status-badge';
import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '@/hooks/use-dashboard';
import { TYPE } from '@/lib/fonts';

const TaskCard = memo(function TaskCard({ task, index }: { task: UpcomingTask; index: number }) {
  const router = useRouter();

  return (
    <AnimatedListItem index={index}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tarea: ${task.name}`}
        className="border-border bg-card mb-3 rounded-xl border p-3"
        onPress={() => router.push(`/task/${task.maintenancePlanId}/${task.id}` as never)}
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
            {task.name}
          </Text>
          <PriorityBadge priority={task.priority} />
        </View>
        <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
          {task.propertyAddress}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text style={TYPE.labelMd} className="text-muted-foreground">
            {task.categoryName}
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            {task.nextDueDate ? formatRelativeDate(new Date(task.nextDueDate)) : 'Según detección'}
          </Text>
        </View>
      </Pressable>
    </AnimatedListItem>
  );
});

export default function DashboardScreen() {
  const router = useRouter();
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
  } = useClientAnalytics();

  const isLoading = statsLoading || tasksLoading;

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchTasks();
    refetchAnalytics();
  }, [refetchStats, refetchTasks, refetchAnalytics]);

  // Compute average condition trend across all categories
  const conditionTrendData = useMemo(() => {
    const trend = analytics?.conditionTrend ?? [];
    if (trend.length === 0) return [];

    return trend.map((point) => {
      const values = Object.values(point.categories);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { label: point.label, value: Math.round(avg * 10) / 10 };
    });
  }, [analytics?.conditionTrend]);

  const costHistoryData = useMemo(() => {
    return (analytics?.costHistory ?? []).map((p) => ({
      label: p.label,
      value: p.value,
    }));
  }, [analytics?.costHistory]);

  const ListHeader = useCallback(
    () => (
      <View>
        <Text style={TYPE.displayLg} className="text-foreground mb-4">
          Mi Panel
        </Text>

        {/* Stats section */}
        {statsLoading && !stats ? (
          <View className="mb-6">
            <StatCardSkeleton />
            <View className="flex-row gap-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
          </View>
        ) : stats ? (
          <View className="mb-6">
            <HealthCard
              totalTasks={stats.pendingTasks + stats.overdueTasks + stats.completedThisMonth}
              completedTasks={stats.completedThisMonth}
              overdueTasks={stats.overdueTasks}
            />
            <View className="flex-row gap-3">
              <AnimatedStatCard
                title="Vencidas"
                value={stats.overdueTasks}
                variant="destructive"
                index={0}
              />
              <AnimatedStatCard title="Pendientes" value={stats.pendingTasks} index={1} />
              <AnimatedStatCard title="Completadas" value={stats.completedThisMonth} index={2} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <AnimatedStatCard title="Presupuestos" value={stats.pendingBudgets} index={3} />
              <AnimatedStatCard title="Servicios" value={stats.openServices} index={4} />
            </View>
          </View>
        ) : null}

        {/* Charts section — graceful degradation: only show if analytics available or loading */}
        <ChartCard
          title="Condición General"
          description="Distribución del estado de tus tareas"
          isLoading={analyticsLoading && !analytics}
          isEmpty={(analytics?.conditionDistribution ?? []).length === 0}
          emptyMessage="Sin datos de condición"
        >
          <MiniDonutChart data={analytics?.conditionDistribution ?? []} />
        </ChartCard>

        <ChartCard
          title="Evolución de Condición"
          description="Promedio mensual de todas las categorías"
          isLoading={analyticsLoading && !analytics}
          isEmpty={conditionTrendData.length === 0}
          emptyMessage="Sin historial de condición"
        >
          <MiniTrendChart data={conditionTrendData} />
        </ChartCard>

        <ChartCard
          title="Gastos del Último Año"
          description="Costos de mantenimiento por mes"
          isLoading={analyticsLoading && !analytics}
          isEmpty={costHistoryData.length === 0}
          emptyMessage="Sin gastos registrados"
        >
          <MiniBarChart data={costHistoryData} />
        </ChartCard>

        <ChartCard
          title="Estado por Categoría"
          description="Progreso y condición por área"
          isLoading={analyticsLoading && !analytics}
          isEmpty={(analytics?.categoryBreakdown ?? []).length === 0}
          emptyMessage="Sin categorías registradas"
        >
          <CategoryBreakdownList data={analytics?.categoryBreakdown ?? []} />
        </ChartCard>

        {/* Quick actions */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Solicitudes de Servicio"
          onPress={() => router.push('/service-requests' as never)}
          className="border-border bg-card mb-6 flex-row items-center justify-between rounded-xl border p-3"
        >
          <View>
            <Text style={TYPE.titleSm} className="text-foreground">
              Solicitudes de Servicio
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Reportar problemas o pedir asistencia
            </Text>
          </View>
          <Text className="text-muted-foreground" style={{ fontSize: 18 }}>
            &gt;
          </Text>
        </Pressable>

        <Text style={TYPE.titleLg} className="text-foreground mb-3">
          Próximas Tareas
        </Text>
      </View>
    ),
    [stats, statsLoading, analytics, analyticsLoading, conditionTrendData, costHistoryData, router],
  );

  const renderTask = useCallback(
    ({ item, index }: { item: UpcomingTask; index: number }) => (
      <TaskCard task={item} index={index} />
    ),
    [],
  );

  if ((statsError || tasksError) && !stats && !tasks) {
    return <ErrorState onRetry={onRefresh} message="No se pudieron cargar los datos del panel." />;
  }

  return (
    <FlatList
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      data={tasks ?? []}
      renderItem={renderTask}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            title="Sin tareas próximas"
            message="No hay tareas de mantenimiento programadas por ahora."
          />
        ) : null
      }
    />
  );
}
