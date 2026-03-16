import type { TaskPublic } from '@epde/shared';
import { formatRelativeDate, TaskStatus } from '@epde/shared';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedListItem } from '@/components/animated-list-item';
import { CollapsibleSection } from '@/components/collapsible-section';
import { CompleteTaskModal } from '@/components/complete-task-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import {
  PlanStatusBadge,
  PriorityBadge,
  PropertyTypeBadge,
  TaskStatusBadge,
} from '@/components/status-badge';
import { SwipeableRow } from '@/components/swipeable-row';
import { usePlan } from '@/hooks/use-plans';
import { useProperty, usePropertyExpenses } from '@/hooks/use-properties';
import { useAnimatedEntry } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { defaultScreenOptions } from '@/lib/screen-options';

type StatusFilter = 'ALL' | typeof TaskStatus.UPCOMING | typeof TaskStatus.OVERDUE;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: TaskStatus.UPCOMING, label: 'Próximas' },
  { key: TaskStatus.OVERDUE, label: 'Vencidas' },
];

function TaskCard({ task, planId }: { task: TaskPublic; planId: string }) {
  const router = useRouter();

  const statusDotColor =
    task.status === TaskStatus.OVERDUE
      ? 'bg-destructive'
      : task.status === TaskStatus.UPCOMING
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
          {task.nextDueDate ? formatRelativeDate(new Date(task.nextDueDate)) : 'Según detección'}
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
  const {
    data: property,
    isLoading: propertyLoading,
    error: propertyError,
    refetch: refetchProperty,
  } = useProperty(id);
  const planId = property?.maintenancePlan?.id;
  const { data: plan, isLoading: planLoading, refetch: refetchPlan } = usePlan(planId ?? '');
  const { data: expenses } = usePropertyExpenses(id);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);

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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (propertyError && !property) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Propiedad', headerBackTitle: 'Volver' }}
        />
        <ErrorState onRetry={refetchProperty} />
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
          ...defaultScreenOptions,
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
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={TYPE.titleLg} className="text-foreground">
                {property?.maintenancePlan?.name ?? 'Plan de Mantenimiento'}
              </Text>
              {property?.maintenancePlan?.status && (
                <PlanStatusBadge status={property.maintenancePlan.status} />
              )}
            </View>

            {!planId && (
              <EmptyState
                title="Sin plan asignado"
                message="Esta propiedad aun no tiene un plan de mantenimiento."
              />
            )}

            {/* Expenses section */}
            {expenses && expenses.items.length > 0 && (
              <CollapsibleSection title={`Gastos (${formatCurrency(expenses.totalCost)})`}>
                <View className="gap-2">
                  {expenses.items.slice(0, 10).map((item, i) => (
                    <View
                      key={i}
                      className="border-border flex-row items-center justify-between border-b pb-2 last:border-0"
                    >
                      <View className="flex-1">
                        <Text style={TYPE.bodySm} className="text-foreground">
                          {item.description}
                        </Text>
                        <Text style={TYPE.labelMd} className="text-muted-foreground">
                          {item.category ?? 'Presupuesto'} ·{' '}
                          {new Date(item.date).toLocaleDateString('es-AR')}
                        </Text>
                      </View>
                      <Text style={TYPE.titleSm} className="text-foreground">
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </CollapsibleSection>
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
                item.status !== TaskStatus.COMPLETED
                  ? [{ icon: '✓', color: COLORS.success, onPress: () => setCompleteTask(item) }]
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
