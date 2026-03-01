import { memo, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBudgets } from '@/hooks/use-budgets';
import { AnimatedListItem } from '@/components/animated-list-item';
import { BudgetStatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CreateBudgetModal } from '@/components/create-budget-modal';
import { TYPE } from '@/lib/fonts';
import type { BudgetRequestPublic } from '@epde/shared/types';

const FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'QUOTED', label: 'Cotizados' },
  { key: 'APPROVED', label: 'Aprobados' },
  { key: 'REJECTED', label: 'Rechazados' },
  { key: 'IN_PROGRESS', label: 'En Progreso' },
  { key: 'COMPLETED', label: 'Completados' },
] as const;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

const BudgetCard = memo(function BudgetCard({ budget }: { budget: BudgetRequestPublic }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/budget/${budget.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
          {budget.title}
        </Text>
        <BudgetStatusBadge status={budget.status} />
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-2">
        {budget.property.address}, {budget.property.city}
      </Text>
      <View className="flex-row items-center justify-between">
        {budget.response ? (
          <Text style={TYPE.titleSm} className="text-foreground">
            {formatAmount(budget.response.totalAmount)}
          </Text>
        ) : (
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Sin cotizar
          </Text>
        )}
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatDistanceToNow(new Date(budget.createdAt), { addSuffix: true, locale: es })}
        </Text>
      </View>
    </Pressable>
  );
});

export default function BudgetsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBudgets(statusFilter ? { status: statusFilter } : {});

  const budgets = data?.pages.flatMap((page) => page.data) ?? [];

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View className="bg-background flex-1">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <BudgetCard budget={item} />
          </AnimatedListItem>
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={TYPE.displayLg} className="text-foreground">
                Presupuestos
              </Text>
              <Pressable
                onPress={() => setCreateModalVisible(true)}
                className="bg-primary rounded-xl px-4 py-2"
              >
                <Text style={TYPE.titleSm} className="text-primary-foreground">
                  Nuevo
                </Text>
              </Pressable>
            </View>
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
              title="Sin presupuestos"
              message="Crea tu primer presupuesto para solicitar una cotizacion."
            />
          ) : null
        }
      />

      <CreateBudgetModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
}
