import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProperty } from '@/hooks/use-properties';
import { usePlan } from '@/hooks/use-maintenance-plans';
import { AnimatedListItem } from '@/components/animated-list-item';
import { SwipeableRow } from '@/components/swipeable-row';
import { CompleteTaskModal } from '@/components/complete-task-modal';
import { TaskStatusBadge, PriorityBadge, PropertyTypeBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { useAnimatedEntry } from '@/lib/animations';
import { TYPE } from '@/lib/fonts';
import type { TaskPublic } from '@epde/shared/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type StatusFilter = 'ALL' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'UPCOMING', label: 'Proximas' },
  { key: 'OVERDUE', label: 'Vencidas' },
  { key: 'COMPLETED', label: 'Completadas' },
];

function TaskCard({ task, planId }: { task: TaskPublic; planId: string }) {
  const router = useRouter();

  const statusDotColor =
    task.status === 'COMPLETED'
      ? 'bg-green-500'
      : task.status === 'OVERDUE'
        ? 'bg-destructive'
        : task.status === 'UPCOMING'
          ? 'bg-primary'
          : 'bg-muted-foreground';

  return (
    <Pressable
      className="border-border bg-card mb-2 rounded-xl border p-3"
      onPress={() => router.push(`/task/${planId}/${task.id}` as never)}
    >
      <View className="mb-1 flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${statusDotColor}`} />
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
          {task.name}
        </Text>
        <PriorityBadge priority={task.priority} />
      </View>
      <View className="ml-4 flex-row items-center justify-between">
        <TaskStatusBadge status={task.status} />
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {task.nextDueDate
            ? formatDistanceToNow(new Date(task.nextDueDate), { addSuffix: true, locale: es })
            : 'Según detección'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [completeTask, setCompleteTask] = useState<TaskPublic | null>(null);

  const infoCardStyle = useAnimatedEntry();
  const { data: property, isLoading: propertyLoading, refetch: refetchProperty } = useProperty(id);
  const planId = property?.maintenancePlan?.id;
  const { data: plan, isLoading: planLoading, refetch: refetchPlan } = usePlan(planId ?? '');

  const sections = useMemo(() => {
    if (!plan?.tasks) return [];

    const filtered =
      statusFilter === 'ALL' ? plan.tasks : plan.tasks.filter((t) => t.status === statusFilter);

    const grouped = new Map<string, TaskPublic[]>();
    for (const task of filtered) {
      const cat = task.category.name;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(task);
    }

    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [plan?.tasks, statusFilter]);

  const onRefresh = useCallback(() => {
    refetchProperty();
    if (planId) refetchPlan();
  }, [refetchProperty, refetchPlan, planId]);

  if (propertyLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Propiedad', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color="#c4704b" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Propiedad', headerBackTitle: 'Volver' }}
        />
        <EmptyState title="No encontrada" message="La propiedad no existe o fue eliminada." />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Propiedad',
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
        }}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={propertyLoading || planLoading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Property info card */}
            <Animated.View
              style={infoCardStyle}
              className="border-border bg-card mb-4 rounded-xl border p-3"
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text style={TYPE.titleLg} className="text-foreground flex-1">
                  {property.address}
                </Text>
                <PropertyTypeBadge type={property.type} />
              </View>
              <Text style={TYPE.bodySm} className="text-muted-foreground">
                {[
                  property.city,
                  property.yearBuilt && `${property.yearBuilt}`,
                  property.squareMeters && `${property.squareMeters} m²`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </Animated.View>

            {/* Plan section title */}
            <Text style={TYPE.titleLg} className="text-foreground mb-3">
              Plan de Mantenimiento
            </Text>

            {!planId && (
              <EmptyState
                title="Sin plan asignado"
                message="Esta propiedad aun no tiene un plan de mantenimiento."
              />
            )}

            {/* Status filter tabs */}
            {planId && (
              <View className="mb-4 flex-row gap-2">
                {FILTERS.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setStatusFilter(f.key)}
                    className={`rounded-full px-3 py-1.5 ${
                      statusFilter === f.key ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Text
                      style={TYPE.labelMd}
                      className={
                        statusFilter === f.key ? 'text-primary-foreground' : 'text-muted-foreground'
                      }
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <SwipeableRow
              rightActions={
                item.status !== 'COMPLETED'
                  ? [{ icon: '✓', color: '#6b9b7a', onPress: () => setCompleteTask(item) }]
                  : []
              }
            >
              <TaskCard task={item} planId={planId!} />
            </SwipeableRow>
          </AnimatedListItem>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={TYPE.titleSm} className="text-foreground bg-background mt-2 mb-2">
            {title}
          </Text>
        )}
        ListEmptyComponent={
          planId && !planLoading ? (
            <EmptyState
              title="Sin tareas"
              message="No hay tareas que coincidan con el filtro seleccionado."
            />
          ) : null
        }
      />

      {completeTask && planId && (
        <CompleteTaskModal
          visible={!!completeTask}
          onClose={() => setCompleteTask(null)}
          task={completeTask}
          planId={planId}
        />
      )}
    </View>
  );
}
