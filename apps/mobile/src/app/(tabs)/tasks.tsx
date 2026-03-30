import type { TaskPriority, TaskStatus } from '@epde/shared';
import {
  formatRelativeDate,
  ProfessionalRequirement,
  PROPERTY_SECTOR_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskStatus as TS,
} from '@epde/shared';
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
import { haptics } from '@/lib/haptics';

const PRIORITY_FILTERS: { key: TaskPriority | undefined; label: string }[] = [
  { key: undefined, label: 'Todas' },
  { key: 'HIGH', label: TASK_PRIORITY_LABELS.HIGH },
  { key: 'MEDIUM', label: TASK_PRIORITY_LABELS.MEDIUM },
  { key: 'LOW', label: TASK_PRIORITY_LABELS.LOW },
];

/** Status order for stat cards: actionable first.
 * COMPLETED excluded — tasks recycle back to PENDING after completion (tracked via TaskLog). */
const STAT_STATUSES: TaskStatus[] = [TS.OVERDUE, TS.PENDING, TS.UPCOMING];

const STAT_COLORS: Record<TaskStatus, string> = {
  [TS.OVERDUE]: 'text-destructive',
  [TS.PENDING]: 'text-status-pending',
  [TS.UPCOMING]: 'text-status-upcoming',
  [TS.COMPLETED]: 'text-status-completed',
};

const STAT_BG: Record<TaskStatus, string> = {
  [TS.OVERDUE]: 'bg-destructive/10',
  [TS.PENDING]: 'bg-status-pending/10',
  [TS.UPCOMING]: 'bg-status-upcoming/10',
  [TS.COMPLETED]: 'bg-status-completed/10',
};

const TaskCard = memo(function TaskCard({ task }: { task: TaskListItem }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tarea: ${task.name}`}
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/task/${task.maintenancePlan.id}/${task.id}` as never)}
    >
      <View className="mb-1 flex-row items-start justify-between gap-2">
        <Text
          style={TYPE.titleSm}
          className="text-foreground flex-1 flex-shrink"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
          {task.name}
        </Text>
        <View className="flex-row gap-1.5">
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </View>
      </View>
      <Text
        style={TYPE.bodySm}
        className="text-muted-foreground mb-1"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {task.category.name}
        {task.sector && ` · ${PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}`}
      </Text>
      {task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO && (
        <Text style={TYPE.labelSm} className="text-warning mt-0.5">
          Requiere profesional
        </Text>
      )}
      <Text
        style={TYPE.bodySm}
        className="text-muted-foreground"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
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
  const [propertyFilter, setPropertyFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  // Server-side status filtering: pass status to API when stat card is active.
  // Stat counts always use the full dataset (no status filter).
  const serverParams = statusFilter ? { status: statusFilter } : undefined;
  const { data: tasks, isLoading, error, refetch } = useAllTasks(serverParams);
  const { data: allTasksForCounts } = useAllTasks();

  const propertyOptions = useMemo(() => {
    if (!tasks) return [];
    const seen = new Map<string, string>();
    for (const t of tasks) {
      const prop = t.maintenancePlan.property;
      if (!seen.has(prop.id)) seen.set(prop.id, prop.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ key: id, label: address }));
  }, [tasks]);

  /** Client-side filtering: priority + property + search (status is server-side). */
  const filtered = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (propertyFilter) {
      result = result.filter((t) => t.maintenancePlan.property.id === propertyFilter);
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
  }, [tasks, priorityFilter, propertyFilter, debouncedSearch]);

  /** Counts per status (from full dataset, independent of active status filter). */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STAT_STATUSES) counts[s] = 0;
    if (allTasksForCounts) {
      for (const t of allTasksForCounts) {
        if (t.status in counts) counts[t.status] = (counts[t.status] ?? 0) + 1;
      }
    }
    return counts;
  }, [allTasksForCounts]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasActiveFilters =
    !!statusFilter || !!priorityFilter || !!propertyFilter || !!debouncedSearch;

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
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Filtrar por estado"
                className="mb-3 flex-row gap-2"
              >
                {STAT_STATUSES.map((status) => (
                  <Pressable
                    key={status}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: statusFilter === status }}
                    accessibilityLabel={`Filtrar por ${TASK_STATUS_LABELS[status]}`}
                    onPress={() => {
                      haptics.selection();
                      setStatusFilter((prev) => (prev === status ? undefined : status));
                    }}
                    className={`flex-1 items-center rounded-lg p-2 ${
                      statusFilter === status ? 'border-primary border-2' : STAT_BG[status]
                    }`}
                  >
                    <Text style={TYPE.titleMd} className={STAT_COLORS[status]}>
                      {statusCounts[status]}
                    </Text>
                    <Text
                      style={TYPE.bodySm}
                      className="text-muted-foreground"
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
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
                accessibilityLabel="Buscar tareas"
                style={TYPE.bodyMd}
                className="text-foreground flex-1 py-2.5"
                placeholder="Buscar tarea, categoría o dirección..."
                placeholderTextColor={COLORS.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch('')}
                  accessibilityLabel="Limpiar búsqueda"
                  accessibilityRole="button"
                >
                  <Text className="text-muted-foreground text-lg">✕</Text>
                </Pressable>
              )}
            </View>

            {/* Priority filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              accessibilityRole="radiogroup"
              accessibilityLabel="Filtrar por prioridad"
            >
              {PRIORITY_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: priorityFilter === f.key }}
                  accessibilityLabel={`Filtrar por ${f.label}`}
                  onPress={() => {
                    haptics.selection();
                    setPriorityFilter(f.key);
                  }}
                  className={`rounded-full px-3 py-2.5 ${
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

            {/* Property filter — only shown when >1 property */}
            {propertyOptions.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginTop: 8 }}
                accessibilityRole="radiogroup"
                accessibilityLabel="Filtrar por propiedad"
              >
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !propertyFilter }}
                  onPress={() => {
                    haptics.selection();
                    setPropertyFilter(undefined);
                  }}
                  className={`rounded-full px-3 py-2 ${!propertyFilter ? 'bg-primary' : 'bg-card border-border border'}`}
                >
                  <Text
                    style={TYPE.labelSm}
                    className={!propertyFilter ? 'text-primary-foreground' : 'text-foreground'}
                  >
                    Todas
                  </Text>
                </Pressable>
                {propertyOptions.map((p) => (
                  <Pressable
                    key={p.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: propertyFilter === p.key }}
                    onPress={() => {
                      haptics.selection();
                      setPropertyFilter(p.key);
                    }}
                    className={`rounded-full px-3 py-2 ${propertyFilter === p.key ? 'bg-primary' : 'bg-card border-border border'}`}
                  >
                    <Text
                      style={TYPE.labelSm}
                      className={
                        propertyFilter === p.key ? 'text-primary-foreground' : 'text-foreground'
                      }
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

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
