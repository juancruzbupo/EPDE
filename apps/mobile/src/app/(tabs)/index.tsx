import { memo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { AnimatedStatCard } from '@/components/animated-stat-card';
import { HealthCard } from '@/components/health-card';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { AnimatedListItem } from '@/components/animated-list-item';
import { PriorityBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TYPE } from '@/lib/fonts';
import type { UpcomingTask } from '@epde/shared/types';

const TaskCard = memo(function TaskCard({ task, index }: { task: UpcomingTask; index: number }) {
  const router = useRouter();

  return (
    <AnimatedListItem index={index}>
      <Pressable
        className="border-border bg-card mb-3 rounded-xl border p-3"
        onPress={() => router.push(`/property/${task.propertyId}` as never)}
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
            {task.nextDueDate
              ? formatDistanceToNow(new Date(task.nextDueDate), { addSuffix: true, locale: es })
              : 'Según detección'}
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

  const isLoading = statsLoading || tasksLoading;

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchTasks();
  }, [refetchStats, refetchTasks]);

  if ((statsError || tasksError) && !stats && !tasks) {
    return <ErrorState onRetry={onRefresh} message="No se pudieron cargar los datos del panel." />;
  }

  const ListHeader = useCallback(
    () => (
      <View>
        <Text style={TYPE.displayLg} className="text-foreground mb-4">
          Mi Panel
        </Text>

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
          </View>
        ) : null}

        {/* Quick actions */}
        <Pressable
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
          Proximas Tareas
        </Text>
      </View>
    ),
    [stats, statsLoading, router],
  );

  const renderTask = useCallback(
    ({ item, index }: { item: UpcomingTask; index: number }) => (
      <TaskCard task={item} index={index} />
    ),
    [],
  );

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
            title="Sin tareas proximas"
            message="No hay tareas de mantenimiento programadas por ahora."
          />
        ) : null
      }
    />
  );
}
