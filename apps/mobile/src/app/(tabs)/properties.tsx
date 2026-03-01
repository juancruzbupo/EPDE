import { memo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProperties } from '@/hooks/use-properties';
import { AnimatedListItem } from '@/components/animated-list-item';
import { PropertyTypeBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TYPE } from '@/lib/fonts';
import type { PropertyPublic } from '@epde/shared/types';

const PropertyCard = memo(function PropertyCard({ property }: { property: PropertyPublic }) {
  const router = useRouter();

  return (
    <Pressable
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
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProperties();

  const properties = data?.pages.flatMap((page) => page.data) ?? [];

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
        <Text style={TYPE.displayLg} className="text-foreground mb-4">
          Mis Propiedades
        </Text>
      }
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState title="Sin propiedades" message="Aun no tienes propiedades registradas." />
        ) : null
      }
    />
  );
}
