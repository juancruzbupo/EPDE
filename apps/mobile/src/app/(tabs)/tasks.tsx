import type { TaskPriority, TaskStatus } from '@epde/shared';
import { formatRelativeDate, TASK_STATUS_LABELS, TaskStatus as TS } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useAllTasks } from '@/hooks/use-plans';
import type { TaskListItem } from '@/lib/api/maintenance-plans';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

const PRIORITY_FILTERS: { key: TaskPriority | undefined; label: string }[] = [
  { key: undefined, label: 'Todas' },
  { key: 'HIGH', label: 'Alta' },
  { key: 'MEDIUM', label: 'Media' },
  { key: 'LOW', label: 'Baja' },
];

/** Status order for stat cards: actionable first. */
const STAT_STATUSES: TaskStatus[] = [TS.OVERDUE, TS.PENDING, TS.UPCOMING, TS.COMPLETED];

const STAT_COLORS: Record<TaskStatus, string> = {
  [TS.OVERDUE]: 'text-red-600',
  [TS.PENDING]: 'text-amber-600',
  [TS.UPCOMING]: 'text-blue-600',
  [TS.COMPLETED]: 'text-emerald-600',
};

const STAT_BG: Record<TaskStatus, string> = {
  [TS.OVERDUE]: 'bg-red-50',
  [TS.PENDING]: 'bg-amber-50',
  [TS.UPCOMING]: 'bg-blue-50',
  [TS.COMPLETED]: 'bg-emerald-50',
};

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
            {formatRelativeDate(new Date(task.nextDueDate))}
          </Text>
        )}
      </Text>
    </Pressable>
  );
});

export default function TasksScreen() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | undefined>(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: tasks, isLoading, error, refetch } = useAllTasks();

  /** Client-side filtering: status + priority + search. */
  const filtered = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.name.toLowerCase().includes(q) ||
          t.maintenancePlan.property.address.toLowerCase().includes(q) ||
          t.maintenancePlan.property.city.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, statusFilter, priorityFilter, debouncedSearch]);

  /** Counts per status (from full dataset, ignoring priority/search filters). */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STAT_STATUSES) counts[s] = 0;
    if (tasks) {
      for (const t of tasks) {
        if (counts[t.status] !== undefined) counts[t.status]++;
      }
    }
    return counts;
  }, [tasks]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasActiveFilters = !!statusFilter || !!priorityFilter || !!debouncedSearch;

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

  return (
    <View className="bg-background flex-1">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        data={filtered}
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

            {/* Stat cards */}
            {tasks && tasks.length > 0 && (
              <View className="mb-3 flex-row gap-2">
                {STAT_STATUSES.map((status) => (
                  <Pressable
                    key={status}
                    onPress={() =>
                      setStatusFilter((prev) => (prev === status ? undefined : status))
                    }
                    className={`flex-1 items-center rounded-lg p-2 ${
                      statusFilter === status ? 'border-primary border-2' : STAT_BG[status]
                    }`}
                  >
                    <Text style={TYPE.titleMd} className={STAT_COLORS[status]}>
                      {statusCounts[status]}
                    </Text>
                    <Text style={TYPE.bodySm} className="text-muted-foreground" numberOfLines={1}>
                      {TASK_STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Search */}
            <View className="border-border bg-card mb-3 flex-row items-center rounded-lg border px-3">
              <Text className="text-muted-foreground mr-2">🔍</Text>
              <TextInput
                style={TYPE.bodyMd}
                className="text-foreground flex-1 py-2.5"
                placeholder="Buscar tarea, categoría o dirección..."
                placeholderTextColor={COLORS.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Text className="text-muted-foreground text-lg">✕</Text>
                </Pressable>
              )}
            </View>

            {/* Priority filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {PRIORITY_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => setPriorityFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 ${
                    priorityFilter === f.key ? 'bg-primary' : 'bg-card border-border border'
                  }`}
                >
                  <Text
                    style={TYPE.labelMd}
                    className={
                      priorityFilter === f.key ? 'text-primary-foreground' : 'text-foreground'
                    }
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Count */}
            <Text style={TYPE.bodySm} className="text-muted-foreground mt-2">
              {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Sin tareas"
              message={
                hasActiveFilters
                  ? 'No se encontraron tareas con esos filtros.'
                  : 'No hay tareas registradas todavía.'
              }
            />
          ) : null
        }
      />
    </View>
  );
}
