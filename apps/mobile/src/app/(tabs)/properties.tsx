import type { BadgeVariant, PlanStatus, PropertyPublic, PropertyType } from '@epde/shared';
import { PLAN_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@epde/shared';
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
import { ContextualEmptyState } from '@/components/contextual-empty-state';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PropertyTypeBadge, StatusBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useProperties } from '@/hooks/use-properties';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { ROUTES } from '@/lib/routes';

const TYPE_FILTERS: { key: PropertyType | undefined; label: string }[] = [
  { key: undefined, label: 'Todos' },
  { key: 'HOUSE', label: PROPERTY_TYPE_LABELS.HOUSE },
  { key: 'APARTMENT', label: PROPERTY_TYPE_LABELS.APARTMENT },
  { key: 'DUPLEX', label: PROPERTY_TYPE_LABELS.DUPLEX },
  { key: 'COUNTRY_HOUSE', label: PROPERTY_TYPE_LABELS.COUNTRY_HOUSE },
  { key: 'OTHER', label: PROPERTY_TYPE_LABELS.OTHER },
];

const PLAN_FILTERS: { key: PlanStatus | undefined; label: string }[] = [
  { key: undefined, label: 'Todos' },
  { key: 'ACTIVE', label: PLAN_STATUS_LABELS.ACTIVE },
  { key: 'DRAFT', label: PLAN_STATUS_LABELS.DRAFT },
  { key: 'ARCHIVED', label: PLAN_STATUS_LABELS.ARCHIVED },
];

function getIsvVariant(score: number): BadgeVariant {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'caution';
  return 'destructive';
}

const PropertyCard = memo(function PropertyCard({ property }: { property: PropertyPublic }) {
  const router = useRouter();
  const isv = property.latestISV;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Propiedad: ${property.address}`}
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(ROUTES.property(property.id) as never)}
    >
      <View className="mb-1 flex-row items-center justify-between gap-2">
        <Text
          style={TYPE.titleMd}
          className="text-foreground flex-1 flex-shrink"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {property.address}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {isv && <StatusBadge label={String(isv.score)} variant={getIsvVariant(isv.score)} />}
          <PropertyTypeBadge type={property.type} />
        </View>
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {[
          property.city,
          property.yearBuilt && `${property.yearBuilt}`,
          property.squareMeters && `${property.squareMeters} m²`,
        ]
          .filter(Boolean)
          .join(' · ')}
        {property.maintenancePlan && (
          <Text style={TYPE.labelMd} className="text-primary">
            {' · '}
            {property.maintenancePlan.name}
          </Text>
        )}
      </Text>
    </Pressable>
  );
});

export default function PropertiesScreen() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PropertyType | undefined>(undefined);
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatus | undefined>(undefined);
  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    }),
    [debouncedSearch, typeFilter],
  );

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProperties(filters);

  const allProperties = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const properties = useMemo(
    () =>
      planStatusFilter
        ? allProperties.filter((p) => p.maintenancePlan?.status === planStatusFilter)
        : allProperties,
    [allProperties, planStatusFilter],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters = !!debouncedSearch || !!typeFilter || !!planStatusFilter;

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading && !data) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Cargando propiedades"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={properties}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <PropertyCard property={item} />
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
          <Text style={TYPE.displayLg} className="text-foreground mb-3">
            Mis Propiedades
          </Text>

          {/* Search */}
          <View className="border-border bg-card mb-3 flex-row items-center rounded-lg border px-3">
            <Text className="text-muted-foreground mr-2">🔍</Text>
            <TextInput
              accessibilityLabel="Buscar propiedades"
              style={TYPE.bodyMd}
              className="text-foreground flex-1 py-2.5"
              placeholder="Buscar por dirección o ciudad..."
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

          {/* Type filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            accessibilityRole="radiogroup"
            accessibilityLabel="Filtrar por tipo"
          >
            {TYPE_FILTERS.map((f) => (
              <Pressable
                key={f.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: typeFilter === f.key }}
                accessibilityLabel={`Filtrar por ${f.label}`}
                onPress={() => {
                  haptics.selection();
                  setTypeFilter(f.key);
                }}
                style={{ minHeight: 44 }}
                className={`items-center justify-center rounded-full px-3 py-2.5 ${
                  typeFilter === f.key ? 'bg-primary' : 'bg-card border-border border'
                }`}
              >
                <Text
                  style={TYPE.labelMd}
                  className={typeFilter === f.key ? 'text-primary-foreground' : 'text-foreground'}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Plan status filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginTop: 8 }}
            accessibilityRole="radiogroup"
            accessibilityLabel="Filtrar por estado del plan"
          >
            {PLAN_FILTERS.map((f) => (
              <Pressable
                key={f.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: planStatusFilter === f.key }}
                accessibilityLabel={`Plan: ${f.label}`}
                onPress={() => {
                  haptics.selection();
                  setPlanStatusFilter(f.key);
                }}
                style={{ minHeight: 44 }}
                className={`items-center justify-center rounded-full px-3 py-2 ${
                  planStatusFilter === f.key ? 'bg-primary' : 'bg-card border-border border'
                }`}
              >
                <Text
                  style={TYPE.labelSm}
                  className={
                    planStatusFilter === f.key ? 'text-primary-foreground' : 'text-foreground'
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
          hasActiveFilters ? (
            <EmptyState
              title="Sin resultados"
              message="No se encontraron propiedades con esos filtros."
            />
          ) : (
            <ContextualEmptyState
              icon="🏠"
              title="Sin propiedades"
              message="Tu propiedad aparecerá acá cuando la arquitecta la registre en el sistema."
            />
          )
        ) : null
      }
    />
  );
}
