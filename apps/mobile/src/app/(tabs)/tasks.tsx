import type { TaskStatus } from '@epde/shared';
import { TASK_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { useAllTasks } from '@/hooks/use-plans';
import type { TaskListItem } from '@/lib/api/maintenance-plans';
import { TYPE } from '@/lib/fonts';

const FILTERS = [
  { key: undefined, label: 'Todas' },
  { key: 'OVERDUE', label: 'Vencidas' },
  { key: 'UPCOMING', label: 'Próximas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'COMPLETED', label: 'Completadas' },
] as const;

const TaskCard = memo(function TaskCard({ task }: { task: TaskListItem }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/task/${task.maintenancePlan.id}/${task.id}` as never)}
    >
      <View className="mb-1 flex-row items-start justify-between gap-2">
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={2}>
          {task.name}
        </Text>
        <View className="flex-row gap-1.5">
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </View>
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
        {task.category.name}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {task.maintenancePlan.property.address}, {task.maintenancePlan.property.city}
        {task.nextDueDate && (
          <Text>
            {' · '}
            {formatDistanceToNow(new Date(task.nextDueDate), { addSuffix: true, locale: es })}
          </Text>
        )}
      </Text>
    </Pressable>
  );
});

export default function TasksScreen() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);

  const { data: tasks, isLoading, error, refetch } = useAllTasks(statusFilter);

  if (error && !tasks) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading && !tasks) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View className="bg-background flex-1">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        data={tasks ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <TaskCard task={item} />
          </AnimatedListItem>
        )}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-4">
            <Text style={TYPE.displayLg} className="text-foreground mb-3">
              Tareas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => setStatusFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 ${statusFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
                >
                  <Text
                    style={TYPE.labelMd}
                    className={
                      statusFilter === f.key ? 'text-primary-foreground' : 'text-foreground'
                    }
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Sin tareas"
              message={
                statusFilter
                  ? `No hay tareas "${TASK_STATUS_LABELS[statusFilter as TaskStatus] ?? statusFilter}".`
                  : 'No hay tareas registradas todavía.'
              }
            />
          ) : null
        }
      />
    </View>
  );
}
