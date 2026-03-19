import type { TaskPublic } from '@epde/shared';
import { formatRelativeDate, PROPERTY_SECTOR_LABELS, TaskStatus } from '@epde/shared';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
import {
  useProperty,
  usePropertyExpenses,
  usePropertyHealthHistory,
  usePropertyHealthIndex,
  usePropertyPhotos,
} from '@/hooks/use-properties';
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
      accessibilityRole="button"
      accessibilityLabel={`Tarea: ${task.name}`}
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
        <View className="flex-row items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {task.sector && (
            <Text style={TYPE.labelMd} className="text-muted-foreground">
              {PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}
            </Text>
          )}
        </View>
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
  const { data: photos } = usePropertyPhotos(id);
  const { data: healthIndex } = usePropertyHealthIndex(id);
  const { data: healthHistory } = usePropertyHealthHistory(id);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);

  // Expenses analytics (parity with web)
  const expenseAnalytics = useMemo(() => {
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

    // Sector grouping
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

            {/* Health / ISV section — first, most important */}
            {healthIndex && healthIndex.score > 0 && (
              <CollapsibleSection title={`Salud (ISV: ${healthIndex.score}/100)`} defaultOpen>
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text
                      style={TYPE.numberLg}
                      className={
                        healthIndex.score >= 80
                          ? 'text-success'
                          : healthIndex.score >= 60
                            ? 'text-primary'
                            : healthIndex.score >= 40
                              ? 'text-warning'
                              : 'text-destructive'
                      }
                    >
                      {healthIndex.score}
                    </Text>
                    <View className="items-end">
                      <Text style={TYPE.titleSm} className="text-foreground">
                        {healthIndex.label}
                      </Text>
                      <Text style={TYPE.bodySm} className="text-muted-foreground">
                        {healthIndex.dimensions.trend > 55
                          ? 'Mejorando'
                          : healthIndex.dimensions.trend < 45
                            ? 'Declinando'
                            : 'Estable'}
                      </Text>
                    </View>
                  </View>
                  {(
                    [
                      { key: 'compliance' as const, name: 'Cumplimiento', hint: 'Tareas al día' },
                      {
                        key: 'condition' as const,
                        name: 'Condición',
                        hint: 'Estado en últimas inspecciones',
                      },
                      { key: 'coverage' as const, name: 'Cobertura', hint: 'Sectores revisados' },
                      {
                        key: 'investment' as const,
                        name: 'Inversión',
                        hint: 'Prevención vs reparaciones',
                      },
                      {
                        key: 'trend' as const,
                        name: 'Tendencia',
                        hint: 'Comparación con trimestre anterior',
                      },
                    ] as const
                  ).map(({ key, name, hint }) => {
                    const value = healthIndex.dimensions[key];
                    return (
                      <View key={key}>
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text style={TYPE.bodySm} className="text-foreground">
                              {name}
                            </Text>
                            <Text style={TYPE.labelSm} className="text-muted-foreground">
                              {hint}
                            </Text>
                          </View>
                          <Text
                            style={TYPE.bodySm}
                            className={
                              value >= 80
                                ? 'text-success font-semibold'
                                : value >= 60
                                  ? 'text-primary font-semibold'
                                  : value >= 40
                                    ? 'text-warning font-semibold'
                                    : 'text-destructive font-semibold'
                            }
                          >
                            {value}
                          </Text>
                        </View>
                        <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                          <View
                            className={`h-full rounded-full ${value >= 80 ? 'bg-success' : value >= 60 ? 'bg-primary' : value >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                            style={{ width: `${value}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                  {healthHistory && healthHistory.length > 1 && (
                    <View className="border-border border-t pt-2">
                      <Text style={TYPE.labelMd} className="text-muted-foreground mb-2">
                        Evolución
                      </Text>
                      <View className="flex-row items-end gap-1" style={{ height: 60 }}>
                        {healthHistory.map((s) => {
                          const h = Math.max(4, (s.score / 100) * 52);
                          return (
                            <View key={s.month} className="flex-1 items-center">
                              <View
                                className={`w-full rounded-t ${s.score >= 80 ? 'bg-success' : s.score >= 60 ? 'bg-primary' : s.score >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ height: h }}
                              />
                              <Text className="text-muted-foreground mt-0.5 text-[8px]">
                                {s.month.slice(5)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
                {/* Report link — opens web report for print/PDF */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver informe técnico completo"
                  onPress={() => {
                    const baseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://app.epde.com.ar';
                    void Linking.openURL(`${baseUrl}/properties/${id}/report`);
                  }}
                  className="border-primary/30 bg-primary/5 items-center rounded-xl border p-3"
                >
                  <Text style={TYPE.labelMd} className="text-primary">
                    Ver Informe Técnico Completo
                  </Text>
                  <Text style={TYPE.bodySm} className="text-muted-foreground mt-0.5">
                    Se abre en el navegador para imprimir o descargar PDF
                  </Text>
                </Pressable>
              </CollapsibleSection>
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

            {!planId && (
              <EmptyState
                title="Sin plan asignado"
                message="Esta propiedad aun no tiene un plan de mantenimiento."
              />
            )}

            {/* Expenses section — with analytics (parity with web) */}
            {expenses && expenses.items.length > 0 && expenseAnalytics && (
              <CollapsibleSection title={`Gastos (${formatCurrency(expenses.totalCost)})`}>
                <View className="gap-3">
                  {/* Preventive savings insight */}
                  <View className="bg-success/5 border-success/20 rounded-lg border p-2.5">
                    <Text style={TYPE.bodySm} className="text-success">
                      El mantenimiento preventivo reduce hasta un 80% el costo de reparaciones
                      mayores.
                    </Text>
                  </View>
                  {/* Stat summary */}
                  <View className="flex-row gap-2">
                    <View className="bg-muted/40 flex-1 rounded-lg p-2.5">
                      <Text style={TYPE.labelMd} className="text-muted-foreground">
                        Mensual prom.
                      </Text>
                      <Text style={TYPE.titleSm} className="text-foreground">
                        {formatCurrency(expenseAnalytics.monthlyAvg)}
                      </Text>
                    </View>
                    <View className="bg-muted/40 flex-1 rounded-lg p-2.5">
                      <Text style={TYPE.labelMd} className="text-muted-foreground">
                        Período
                      </Text>
                      <Text style={TYPE.titleSm} className="text-foreground">
                        {expenseAnalytics.months} mes{expenseAnalytics.months !== 1 ? 'es' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Category breakdown */}
                  <View className="gap-2">
                    {expenseAnalytics.categories.slice(0, 5).map((cat) => {
                      const pct =
                        expenseAnalytics.maxTotal > 0
                          ? (cat.total / expenseAnalytics.maxTotal) * 100
                          : 0;
                      return (
                        <View key={cat.name}>
                          <View className="flex-row items-center justify-between">
                            <Text style={TYPE.bodySm} className="text-foreground">
                              {cat.name}
                            </Text>
                            <Text style={TYPE.bodySm} className="text-foreground">
                              {formatCurrency(cat.total)}
                            </Text>
                          </View>
                          <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                            <View
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Sector breakdown */}
                  {expenseAnalytics.sectors.length > 0 && (
                    <View className="gap-2">
                      <Text style={TYPE.labelMd} className="text-muted-foreground">
                        Por sector
                      </Text>
                      {expenseAnalytics.sectors.slice(0, 5).map((sec) => {
                        const pct =
                          expenseAnalytics.maxSectorTotal > 0
                            ? (sec.total / expenseAnalytics.maxSectorTotal) * 100
                            : 0;
                        return (
                          <View key={sec.name}>
                            <View className="flex-row items-center justify-between">
                              <Text style={TYPE.bodySm} className="text-foreground">
                                {sec.name}
                              </Text>
                              <Text style={TYPE.bodySm} className="text-foreground">
                                {formatCurrency(sec.total)}
                              </Text>
                            </View>
                            <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                              <View
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Item list */}
                  <View className="border-border border-t pt-2">
                    <Text style={TYPE.labelMd} className="text-muted-foreground mb-2">
                      Últimos movimientos
                    </Text>
                    {expenses.items.slice(0, 5).map((item) => (
                      <View
                        key={`${item.date}-${item.description}`}
                        className="border-border flex-row items-center justify-between border-b py-1.5 last:border-0"
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
                </View>
              </CollapsibleSection>
            )}

            {/* Photos section */}
            {photos && photos.length > 0 && (
              <CollapsibleSection title={`Fotos (${photos.length})`}>
                <View className="flex-row flex-wrap gap-2">
                  {photos.slice(0, 12).map((photo) => (
                    <Pressable
                      key={`${photo.url}-${photo.date}`}
                      accessibilityRole="button"
                      accessibilityLabel="Ver foto"
                      onPress={() => Linking.openURL(photo.url)}
                      className="overflow-hidden rounded-lg"
                    >
                      <Image
                        source={{ uri: photo.url }}
                        className="h-24 w-24 rounded-lg"
                        resizeMode="cover"
                        accessibilityLabel={photo.description || 'Foto de la propiedad'}
                      />
                      <View className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5">
                        <Text className="text-center text-[9px] text-white" numberOfLines={1}>
                          {photo.source === 'task' ? 'Tarea' : 'Solicitud'}
                        </Text>
                      </View>
                    </Pressable>
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
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar por ${f.label}`}
                    onPress={() => setStatusFilter(f.key)}
                    className={`rounded-full px-3 py-2.5 ${
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
