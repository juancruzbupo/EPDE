import {
  BUDGET_STATUS_PLURAL_LABELS,
  type BudgetRequestPublic,
  BudgetStatus,
  formatARS,
  formatRelativeDate,
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
import { CreateBudgetModal } from '@/components/create-budget-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { BudgetStatusBadge } from '@/components/status-badge';
import { useBudgets } from '@/hooks/use-budgets';
import { useDebounce } from '@/hooks/use-debounce';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

const FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: BudgetStatus.PENDING, label: BUDGET_STATUS_PLURAL_LABELS.PENDING },
  { key: BudgetStatus.QUOTED, label: BUDGET_STATUS_PLURAL_LABELS.QUOTED },
  { key: BudgetStatus.APPROVED, label: BUDGET_STATUS_PLURAL_LABELS.APPROVED },
  { key: BudgetStatus.REJECTED, label: BUDGET_STATUS_PLURAL_LABELS.REJECTED },
  { key: BudgetStatus.IN_PROGRESS, label: BUDGET_STATUS_PLURAL_LABELS.IN_PROGRESS },
  { key: BudgetStatus.COMPLETED, label: BUDGET_STATUS_PLURAL_LABELS.COMPLETED },
] as const;

const BudgetCard = memo(function BudgetCard({ budget }: { budget: BudgetRequestPublic }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Presupuesto: ${budget.title}`}
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/budget/${budget.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between gap-2">
        <Text
          style={TYPE.titleSm}
          className="text-foreground flex-1 flex-shrink"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {budget.title}
        </Text>
        <BudgetStatusBadge status={budget.status} />
      </View>
      <Text
        style={TYPE.bodySm}
        className="text-muted-foreground mb-2"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {budget.property.address}, {budget.property.city}
      </Text>
      <View className="flex-row items-center justify-between gap-2">
        {budget.response ? (
          <Text
            style={TYPE.titleSm}
            className="text-foreground flex-shrink"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {formatARS(budget.response.totalAmount)}
          </Text>
        ) : (
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Esperando cotización
          </Text>
        )}
        <Text
          style={TYPE.bodySm}
          className="text-muted-foreground"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {formatRelativeDate(new Date(budget.createdAt))}
        </Text>
      </View>
    </Pressable>
  );
});

export default function BudgetsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | undefined>(undefined);
  const [propertyFilter, setPropertyFilter] = useState<string | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [debouncedSearch, statusFilter],
  );

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBudgets(filters);

  const allBudgetsRaw = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of allBudgetsRaw) {
      if (!seen.has(b.propertyId)) seen.set(b.propertyId, b.property.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ key: id, label: address }));
  }, [allBudgetsRaw]);

  const budgets = useMemo(
    () =>
      propertyFilter ? allBudgetsRaw.filter((b) => b.propertyId === propertyFilter) : allBudgetsRaw,
    [allBudgetsRaw, propertyFilter],
  );

  const hasActiveFilters = !!debouncedSearch || !!statusFilter || !!propertyFilter;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading && !data) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Cargando presupuestos"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
                accessibilityRole="button"
                accessibilityLabel="Nuevo presupuesto"
                onPress={() => setCreateModalVisible(true)}
                className="bg-primary rounded-xl px-4 py-2"
              >
                <Text style={TYPE.titleSm} className="text-primary-foreground">
                  Nuevo
                </Text>
              </Pressable>
            </View>

            {/* Search */}
            <View className="border-border bg-card mb-3 flex-row items-center rounded-lg border px-3">
              <Text className="text-muted-foreground mr-2">🔍</Text>
              <TextInput
                accessibilityLabel="Buscar presupuestos"
                style={TYPE.bodyMd}
                className="text-foreground flex-1 py-2.5"
                placeholder="Buscar por título o dirección..."
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              accessibilityRole="radiogroup"
              accessibilityLabel="Filtrar por estado"
            >
              {FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: statusFilter === f.key }}
                  accessibilityLabel={`Filtrar por ${f.label}`}
                  onPress={() => {
                    haptics.selection();
                    setStatusFilter(f.key);
                  }}
                  className={`rounded-full px-3 py-2.5 ${statusFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
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
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Sin presupuestos"
              message={
                hasActiveFilters
                  ? 'No se encontraron presupuestos con esos filtros.'
                  : 'Creá tu primer presupuesto para solicitar una cotización.'
              }
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
