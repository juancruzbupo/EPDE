import type { TaskPublic } from '@epde/shared';
import { PlanStatus, PROPERTY_SECTOR_LABELS, TaskStatus, UserRole } from '@epde/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { CompleteTaskModal } from '@/components/complete-task-modal';
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PropertyTaskCard } from '@/components/property-task-card';
import { PlanStatusBadge } from '@/components/status-badge';
import { SwipeableRow } from '@/components/swipeable-row';
import { usePlan, useUpdatePlan } from '@/hooks/use-plans';
import {
  useProperty,
  usePropertyExpenses,
  usePropertyHealthHistory,
  usePropertyHealthIndex,
  usePropertyPhotos,
  usePropertyProblems,
} from '@/hooks/use-properties';
import { useAnimatedEntry } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';
import { useAuthStore } from '@/stores/auth-store';

import type { ExpenseAnalytics } from './components/property-expense-section';
import {
  PropertyExpenseSection,
  PropertyPhotosSection,
} from './components/property-expense-section';
import {
  PropertyHealthSection,
  PropertyProblemsSection,
} from './components/property-health-section';
import { PropertyInfoCard } from './components/property-info-card';
import type { StatusFilter } from './components/property-task-filters';
import { CategoryFilter, StatusFilterPills } from './components/property-task-filters';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [completeTask, setCompleteTask] = useState<TaskPublic | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const updatePlan = useUpdatePlan();

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
  const { data: photos } = usePropertyPhotos(id);
  const { data: healthIndex } = usePropertyHealthIndex(id);
  const { data: healthHistory } = usePropertyHealthHistory(id);
  const { data: problems } = usePropertyProblems(id);

  // Expenses analytics (parity with web)
  const expenseAnalytics = useMemo<ExpenseAnalytics | null>(() => {
    if (!expenses || expenses.items.length === 0) return null;
    const items = expenses.items;
    const dates = items.map((i) => new Date(i.date).getTime());
    const oldest = new Date(Math.min(...dates));
    const months = Math.max(
      1,
      Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );
    const monthlyAvg = expenses.totalCost / months;

    const byCategory = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const cat = item.category ?? 'Presupuestos';
      const entry = byCategory.get(cat) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      byCategory.set(cat, entry);
    }
    const categories = [...byCategory.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const bySector = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const sec = item.sector
        ? (PROPERTY_SECTOR_LABELS[item.sector as keyof typeof PROPERTY_SECTOR_LABELS] ??
          item.sector)
        : 'Sin sector';
      const entry = bySector.get(sec) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      bySector.set(sec, entry);
    }
    const sectors = [...bySector.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      months,
      monthlyAvg,
      categories,
      sectors,
      maxTotal: categories[0]?.total ?? 0,
      maxSectorTotal: sectors[0]?.total ?? 0,
    };
  }, [expenses]);

  const categoryOptions = useMemo(() => {
    if (!plan?.tasks) return [];
    const seen = new Map<string, string>();
    for (const t of plan.tasks) {
      if (!seen.has(t.category.id)) seen.set(t.category.id, t.category.name);
    }
    return [...seen.entries()].map(([cid, name]) => ({ key: cid, label: name }));
  }, [plan?.tasks]);

  const sections = useMemo(() => {
    if (!plan?.tasks) return [];

    let result = plan.tasks;
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (categoryFilter) {
      result = result.filter((t) => t.category.id === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
      );
    }

    const grouped = new Map<string, TaskPublic[]>();
    for (const task of result) {
      const cat = task.category.name;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(task);
    }

    // Sort tasks within each category by riskScore (highest first)
    for (const tasks of grouped.values()) {
      tasks.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
    }

    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [plan?.tasks, statusFilter, categoryFilter, search]);

  const onRefresh = useCallback(() => {
    refetchProperty();
    if (planId) refetchPlan();
  }, [refetchProperty, refetchPlan, planId]);

  const handleRequestService = useCallback(() => {
    setShowServiceModal(true);
  }, []);

  const handleStatusChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
  }, []);

  const handleCategoryChange = useCallback((category: string | undefined) => {
    setCategoryFilter(category);
  }, []);

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
        maxToRenderPerBatch={10}
        windowSize={7}
        initialNumToRender={15}
        removeClippedSubviews
        refreshControl={
          <RefreshControl refreshing={propertyLoading || planLoading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <PropertyInfoCard
              address={property.address}
              type={property.type}
              city={property.city}
              yearBuilt={property.yearBuilt}
              squareMeters={property.squareMeters}
              animatedStyle={infoCardStyle}
            />

            {healthIndex && healthIndex.score > 0 && (
              <PropertyHealthSection
                healthIndex={healthIndex}
                healthHistory={healthHistory}
                propertyId={id}
              />
            )}

            {/* Plan section title */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={TYPE.titleLg} className="text-foreground">
                {property?.maintenancePlan?.name ?? 'Plan de Mantenimiento'}
              </Text>
              {property?.maintenancePlan?.status && (
                <PlanStatusBadge status={property.maintenancePlan.status} />
              )}
            </View>

            {/* Admin: Plan actions (Activate / Archive) */}
            {isAdmin && planId && property?.maintenancePlan?.status === PlanStatus.DRAFT && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Activar plan"
                onPress={() => {
                  haptics.medium();
                  Alert.alert(
                    'Activar Plan',
                    '\u00bfEst\u00e1s seguro de que quer\u00e9s activar este plan?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Activar',
                        onPress: () => updatePlan.mutate({ id: planId, status: PlanStatus.ACTIVE }),
                      },
                    ],
                  );
                }}
                disabled={updatePlan.isPending}
                className="bg-primary mb-3 items-center rounded-xl py-3 active:opacity-80"
              >
                <Text style={TYPE.titleMd} className="text-primary-foreground">
                  Activar Plan
                </Text>
              </Pressable>
            )}
            {isAdmin && planId && property?.maintenancePlan?.status === PlanStatus.ACTIVE && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Archivar plan"
                onPress={() => {
                  haptics.medium();
                  Alert.alert(
                    'Archivar Plan',
                    '\u00bfEst\u00e1s seguro de que quer\u00e9s archivar este plan? Las tareas dejar\u00e1n de generar vencimientos.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Archivar',
                        style: 'destructive',
                        onPress: () =>
                          updatePlan.mutate({ id: planId, status: PlanStatus.ARCHIVED }),
                      },
                    ],
                  );
                }}
                disabled={updatePlan.isPending}
                className="border-destructive mb-3 items-center rounded-xl border py-3"
              >
                <Text style={TYPE.titleMd} className="text-destructive">
                  Archivar Plan
                </Text>
              </Pressable>
            )}

            {!planId && (
              <EmptyState
                title="Sin plan asignado"
                message="Esta propiedad aun no tiene un plan de mantenimiento."
              />
            )}

            {/* Detected problems */}
            {problems && problems.length > 0 && (
              <PropertyProblemsSection
                problems={problems}
                onRequestService={handleRequestService}
              />
            )}

            {/* Expenses section */}
            {expenses && expenses.items.length > 0 && expenseAnalytics && (
              <PropertyExpenseSection
                totalCost={expenses.totalCost}
                items={expenses.items}
                analytics={expenseAnalytics}
              />
            )}

            {/* Photos section */}
            {photos && photos.length > 0 && <PropertyPhotosSection photos={photos} />}

            {/* Task status summary */}
            {plan?.tasks && plan.tasks.length > 0 && (
              <View className="mb-3 flex-row gap-3">
                {[
                  {
                    label: 'Vencidas',
                    count: plan.tasks.filter((t) => t.status === TaskStatus.OVERDUE).length,
                    color: 'text-destructive',
                  },
                  {
                    label: 'Próximas',
                    count: plan.tasks.filter((t) => t.status === TaskStatus.UPCOMING).length,
                    color: 'text-primary',
                  },
                  {
                    label: 'Pendientes',
                    count: plan.tasks.filter((t) => t.status === TaskStatus.PENDING).length,
                    color: 'text-muted-foreground',
                  },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    className="bg-card border-border flex-1 items-center rounded-xl border py-2"
                  >
                    <Text style={TYPE.titleMd} className={stat.color}>
                      {stat.count}
                    </Text>
                    <Text style={TYPE.labelSm} className="text-muted-foreground">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Search */}
            {planId && (
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar tarea..."
                placeholderTextColor="#999"
                accessibilityLabel="Buscar tareas"
                className="border-border bg-card text-foreground mb-3 rounded-xl border px-4 py-3 text-sm"
              />
            )}

            {/* Status filter tabs */}
            {planId && (
              <StatusFilterPills statusFilter={statusFilter} onStatusChange={handleStatusChange} />
            )}

            {/* Category filter */}
            {planId && categoryOptions.length > 1 && (
              <CategoryFilter
                categoryOptions={categoryOptions}
                categoryFilter={categoryFilter}
                onCategoryChange={handleCategoryChange}
              />
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <SwipeableRow
              rightActions={
                item.status !== TaskStatus.COMPLETED
                  ? [
                      {
                        icon: '\u2713',
                        color: COLORS.success,
                        onPress: () => setCompleteTask(item),
                      },
                    ]
                  : []
              }
            >
              <PropertyTaskCard task={item} planId={planId!} />
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

      {/* Service request modal from detected problems */}
      <CreateServiceRequestModal
        visible={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        defaultPropertyId={property?.id}
      />
    </View>
  );
}
