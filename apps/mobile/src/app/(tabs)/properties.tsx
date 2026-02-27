import { memo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProperties } from '@/hooks/use-properties';
import { PropertyTypeBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import type { PropertyPublic } from '@epde/shared/types';

const PropertyCard = memo(function PropertyCard({ property }: { property: PropertyPublic }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-4"
      onPress={() => router.push(`/property/${property.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text
          style={{ fontFamily: 'DMSans_700Bold' }}
          className="text-foreground flex-1 text-base"
          numberOfLines={1}
        >
          {property.address}
        </Text>
        <PropertyTypeBadge type={property.type} />
      </View>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mb-2 text-sm"
      >
        {property.city}
      </Text>
      <View className="flex-row items-center gap-4">
        {property.yearBuilt && (
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground text-xs"
          >
            Ano: {property.yearBuilt}
          </Text>
        )}
        {property.squareMeters && (
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground text-xs"
          >
            {property.squareMeters} m2
          </Text>
        )}
        {property.maintenancePlan && (
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-primary text-xs">
            Plan: {property.maintenancePlan.name}
          </Text>
        )}
      </View>
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
      renderItem={({ item }) => <PropertyCard property={item} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Text
          style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
          className="text-foreground mb-4 text-2xl"
        >
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
