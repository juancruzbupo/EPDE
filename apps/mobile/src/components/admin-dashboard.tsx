import type { ActivityItem } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { AnimatedStatCard } from '@/components/animated-stat-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { useAdminActivity, useAdminAnalytics, useAdminDashboardStats } from '@/hooks/use-dashboard';
import { TYPE } from '@/lib/fonts';

const ActivityCard = memo(function ActivityCard({ item }: { item: ActivityItem }) {
  const router = useRouter();

  const onPress = () => {
    const meta = item.metadata as Record<string, string> | undefined;
    if (meta?.propertyId) router.push(`/property/${meta.propertyId}` as never);
    else if (meta?.budgetId) router.push(`/budget/${meta.budgetId}` as never);
    else if (meta?.serviceRequestId)
      router.push(`/service-requests/${meta.serviceRequestId}` as never);
  };

  return (
    <Pressable
      onPress={onPress}
      className="border-border bg-card mb-2 rounded-xl border p-3 active:opacity-60"
    >
      <Text style={TYPE.bodySm} className="text-foreground">
        {item.description}
      </Text>
      <Text style={TYPE.labelMd} className="text-muted-foreground mt-0.5">
        {formatRelativeDate(new Date(item.timestamp))}
      </Text>
    </Pressable>
  );
});

export function AdminDashboard() {
  const router = useRouter();
  const [chartMonths] = useState(6);
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAdminDashboardStats();
  const {
    data: activity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useAdminActivity();
  const {
    data: analytics,
    isLoading: _analyticsLoading,
    refetch: refetchAnalytics,
  } = useAdminAnalytics(chartMonths);

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchActivity();
    refetchAnalytics();
  }, [refetchStats, refetchActivity, refetchAnalytics]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);

  const ListHeader = useCallback(
    () => (
      <View>
        <Text style={TYPE.displayLg} className="text-foreground mb-4">
          Panel Admin
        </Text>

        {/* KPI Stats */}
        {statsLoading && !stats ? (
          <View className="mb-6">
            <View className="flex-row gap-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
          </View>
        ) : statsError ? (
          <ErrorState onRetry={refetchStats} />
        ) : stats ? (
          <View className="mb-6">
            <View className="flex-row gap-3">
              <AnimatedStatCard title="Clientes" value={stats.totalClients} />
              <AnimatedStatCard title="Propiedades" value={stats.totalProperties} />
              <AnimatedStatCard
                title="Vencidas"
                value={stats.overdueTasks}
                variant={stats.overdueTasks > 0 ? 'destructive' : 'default'}
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <AnimatedStatCard title="Presupuestos" value={stats.pendingBudgets} />
              <AnimatedStatCard title="Servicios" value={stats.pendingServices} />
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View className="mb-4 gap-2">
          <Text style={TYPE.titleMd} className="text-foreground mb-1">
            Acciones rápidas
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/budgets' as never)}
            className="bg-card border-border rounded-lg border p-3 active:opacity-60"
          >
            <Text style={TYPE.bodySm} className="text-foreground">
              📋 Presupuestos por responder
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks' as never)}
            className="bg-card border-border rounded-lg border p-3 active:opacity-60"
          >
            <Text style={TYPE.bodySm} className="text-foreground">
              ✅ Tareas vencidas
            </Text>
          </Pressable>
        </View>

        {/* Key Metrics */}
        {analytics && (
          <View className="mb-4">
            <Text style={TYPE.titleMd} className="text-foreground mb-2">
              Métricas clave
            </Text>
            <View className="bg-card border-border gap-3 rounded-xl border p-4">
              <View className="flex-row items-center justify-between">
                <Text style={TYPE.bodySm} className="text-muted-foreground">
                  Costo total mantenimiento
                </Text>
                <Text style={TYPE.titleSm} className="text-foreground">
                  {formatCurrency(analytics.totalMaintenanceCost)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text style={TYPE.bodySm} className="text-muted-foreground">
                  Tasa de completamiento
                </Text>
                <Text style={TYPE.titleSm} className="text-foreground">
                  {analytics.completionRate}%
                </Text>
              </View>
              {analytics.avgBudgetResponseDays !== null && (
                <View className="flex-row items-center justify-between">
                  <Text style={TYPE.bodySm} className="text-muted-foreground">
                    Respuesta promedio presupuestos
                  </Text>
                  <Text style={TYPE.titleSm} className="text-foreground">
                    {analytics.avgBudgetResponseDays} días
                  </Text>
                </View>
              )}
              {analytics.slaMetrics.avgResponseHours !== null && (
                <View className="flex-row items-center justify-between">
                  <Text style={TYPE.bodySm} className="text-muted-foreground">
                    Tiempo respuesta solicitudes
                  </Text>
                  <Text
                    style={TYPE.titleSm}
                    className={
                      analytics.slaMetrics.avgResponseHours <= 24
                        ? 'text-success'
                        : analytics.slaMetrics.avgResponseHours <= 72
                          ? 'text-warning'
                          : 'text-destructive'
                    }
                  >
                    {analytics.slaMetrics.avgResponseHours}h
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Activity header */}
        <Text style={TYPE.titleMd} className="text-foreground mb-2">
          Actividad reciente
        </Text>
      </View>
    ),
    [stats, statsLoading, statsError, analytics, refetchStats, router, formatCurrency],
  );

  const activityItems = activity ?? [];

  if (statsError && !stats) {
    return <ErrorState onRetry={refetchStats} />;
  }

  return (
    <View className="bg-background flex-1">
      <FlatList
        className="flex-1 px-4 pt-4"
        data={activityItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityCard item={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          activityLoading ? null : (
            <EmptyState title="Sin actividad" message="No hay actividad reciente." />
          )
        }
        refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={onRefresh} />}
      />
    </View>
  );
}
