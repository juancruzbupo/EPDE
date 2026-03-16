import { PLAN_STATUS_LABELS, PlanStatus } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PlanStatusBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlans } from '@/hooks/use-plans';
import type { PlanListItem } from '@/lib/api/maintenance-plans';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

const PlanCard = memo(function PlanCard({ plan }: { plan: PlanListItem }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/property/${plan.property.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
          {plan.name}
        </Text>
        <PlanStatusBadge status={plan.status} />
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {plan.property.address}, {plan.property.city}
        {' · '}
        <Text style={TYPE.labelMd} className="text-foreground/60">
          {plan._count.tasks} tarea{plan._count.tasks !== 1 ? 's' : ''}
        </Text>
      </Text>
    </Pressable>
  );
});

const STATUS_ORDER = [PlanStatus.ACTIVE, PlanStatus.DRAFT, PlanStatus.ARCHIVED] as const;

export default function MaintenancePlansScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: plans, isLoading, error, refetch } = usePlans();

  /** Client-side filtering: search by plan name or property address. */
  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    if (!debouncedSearch) return plans;

    const q = debouncedSearch.toLowerCase();
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.property.address.toLowerCase().includes(q) ||
        p.property.city.toLowerCase().includes(q),
    );
  }, [plans, debouncedSearch]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error && !plans) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading && !plans) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const sections = STATUS_ORDER.map((status) => ({
    title: PLAN_STATUS_LABELS[status] ?? status,
    data: filteredPlans.filter((p) => p.status === status),
  })).filter((s) => s.data.length > 0);

  return (
    <SectionList
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <PlanCard plan={item} />
        </AnimatedListItem>
      )}
      renderSectionHeader={({ section }) => (
        <Text
          style={TYPE.labelMd}
          className="text-muted-foreground mt-4 mb-2 tracking-wider uppercase"
        >
          {section.title}
        </Text>
      )}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View className="mb-2">
          <Text style={TYPE.displayLg} className="text-foreground mb-3">
            Planes
          </Text>

          {/* Search */}
          <View className="border-border bg-card flex-row items-center rounded-lg border px-3">
            <Text className="text-muted-foreground mr-2">🔍</Text>
            <TextInput
              style={TYPE.bodyMd}
              className="text-foreground flex-1 py-2.5"
              placeholder="Buscar plan o dirección..."
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

          {/* Count */}
          <Text style={TYPE.bodySm} className="text-muted-foreground mt-2">
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? 'es' : ''}
          </Text>
        </View>
      }
      ListEmptyComponent={
        !isLoading ? (
          debouncedSearch ? (
            <EmptyState
              title="Sin resultados"
              message="No se encontraron planes con esa búsqueda."
            />
          ) : (
            <EmptyState
              title="Sin planes"
              message="Los planes de mantenimiento se crean al agregar una propiedad."
            />
          )
        ) : null
      }
      stickySectionHeadersEnabled={false}
    />
  );
}
