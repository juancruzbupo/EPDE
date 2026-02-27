import { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { StatCard } from '@/components/stat-card';
import { PriorityBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import type { UpcomingTask } from '@epde/shared/types';

function TaskCard({ task }: { task: UpcomingTask }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-4"
      onPress={() => router.push(`/property/${task.maintenancePlanId}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text
          style={{ fontFamily: 'DMSans_700Bold' }}
          className="text-foreground flex-1 text-sm"
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <PriorityBadge priority={task.priority} />
      </View>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mb-1 text-xs"
      >
        {task.propertyAddress}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-muted-foreground text-xs">
          {task.categoryName}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(task.nextDueDate), { addSuffix: true, locale: es })}
        </Text>
      </View>
    </Pressable>
  );
}

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

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
    >
      <Text
        style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
        className="text-foreground mb-4 text-2xl"
      >
        Mi Panel
      </Text>

      {stats && (
        <View className="mb-6">
          <View className="mb-3 flex-row gap-3">
            <StatCard title="Propiedades" value={stats.totalProperties} />
            <StatCard title="Tareas Pendientes" value={stats.pendingTasks} />
          </View>
          <View className="mb-3 flex-row gap-3">
            <StatCard title="Tareas Vencidas" value={stats.overdueTasks} variant="destructive" />
            <StatCard title="Completadas (mes)" value={stats.completedThisMonth} />
          </View>
          <View className="flex-row gap-3">
            <StatCard title="Presupuestos" value={stats.pendingBudgets} />
            <StatCard title="Servicios" value={stats.openServices} />
          </View>
        </View>
      )}

      {/* Quick actions */}
      <Pressable
        onPress={() => router.push('/service-requests' as never)}
        className="border-border bg-card mb-6 flex-row items-center justify-between rounded-xl border p-4"
      >
        <View>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground text-sm">
            Solicitudes de Servicio
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground text-xs"
          >
            Reportar problemas o pedir asistencia
          </Text>
        </View>
        <Text className="text-muted-foreground text-lg">&gt;</Text>
      </Pressable>

      <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-3 text-lg">
        Proximas Tareas
      </Text>

      {tasks && tasks.length > 0
        ? tasks.map((task) => <TaskCard key={task.id} task={task} />)
        : !isLoading && (
            <EmptyState
              title="Sin tareas proximas"
              message="No hay tareas de mantenimiento programadas por ahora."
            />
          )}
    </ScrollView>
  );
}
