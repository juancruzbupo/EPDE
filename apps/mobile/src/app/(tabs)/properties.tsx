import type { PropertyPublic, PropertyType } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
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
import { PropertyTypeBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useProperties } from '@/hooks/use-properties';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

const TYPE_FILTERS: { key: PropertyType | undefined; label: string }[] = [
  { key: undefined, label: 'Todos' },
  { key: 'HOUSE', label: PROPERTY_TYPE_LABELS.HOUSE },
  { key: 'APARTMENT', label: PROPERTY_TYPE_LABELS.APARTMENT },
  { key: 'DUPLEX', label: PROPERTY_TYPE_LABELS.DUPLEX },
  { key: 'COUNTRY_HOUSE', label: PROPERTY_TYPE_LABELS.COUNTRY_HOUSE },
  { key: 'OTHER', label: PROPERTY_TYPE_LABELS.OTHER },
];

const PropertyCard = memo(function PropertyCard({ property }: { property: PropertyPublic }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Propiedad: ${property.address}`}
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/property/${property.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleMd} className="text-foreground flex-1" numberOfLines={1}>
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

  const properties = data?.pages.flatMap((page) => page.data) ?? [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters = !!debouncedSearch || !!typeFilter;

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading && !data) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
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
      getItemLayout={(_, index) => ({ length: 82, offset: 82 * index, index })}
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
          >
            {TYPE_FILTERS.map((f) => (
              <Pressable
                key={f.label}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${f.label}`}
                onPress={() => {
                  haptics.selection();
                  setTypeFilter(f.key);
                }}
                className={`rounded-full px-3 py-2.5 ${
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
            title="Sin propiedades"
            message={
              hasActiveFilters
                ? 'No se encontraron propiedades con esos filtros.'
                : 'Aún no tenés propiedades registradas.'
            }
          />
        ) : null
      }
    />
  );
}
