import type { ServiceRequestPublic, ServiceStatus, ServiceUrgency } from '@epde/shared';
import { formatRelativeDate, SERVICE_URGENCY_LABELS } from '@epde/shared';
import { Stack, useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
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
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'OPEN', label: 'Abiertos' },
  { key: 'IN_REVIEW', label: 'En Revisión' },
  { key: 'IN_PROGRESS', label: 'En Progreso' },
  { key: 'RESOLVED', label: 'Resueltos' },
  { key: 'CLOSED', label: 'Cerrados' },
] as const;

const URGENCY_FILTERS: { key: ServiceUrgency | undefined; label: string }[] = [
  { key: undefined, label: 'Todas' },
  { key: 'URGENT', label: SERVICE_URGENCY_LABELS.URGENT },
  { key: 'HIGH', label: SERVICE_URGENCY_LABELS.HIGH },
  { key: 'MEDIUM', label: SERVICE_URGENCY_LABELS.MEDIUM },
  { key: 'LOW', label: SERVICE_URGENCY_LABELS.LOW },
];

const ServiceRequestCard = memo(function ServiceRequestCard({
  request,
}: {
  request: ServiceRequestPublic;
}) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Solicitud: ${request.title}`}
      className="border-border bg-card mb-3 rounded-xl border p-4"
      onPress={() => router.push(`/service-requests/${request.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
          {request.title}
        </Text>
        <ServiceStatusBadge status={request.status} />
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-2">
        {request.property.address}, {request.property.city}
      </Text>
      <View className="flex-row items-center justify-between">
        <UrgencyBadge urgency={request.urgency} />
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatRelativeDate(new Date(request.createdAt))}
        </Text>
      </View>
    </Pressable>
  );
});

export default function ServiceRequestsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | undefined>(undefined);
  const [urgencyFilter, setUrgencyFilter] = useState<ServiceUrgency | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(urgencyFilter ? { urgency: urgencyFilter } : {}),
  };

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useServiceRequests(filters);

  const requests = data?.pages.flatMap((page) => page.data) ?? [];
  const hasActiveFilters = !!debouncedSearch || !!statusFilter || !!urgencyFilter;

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
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Solicitudes de Servicio',
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <ServiceRequestCard request={item} />
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nueva solicitud de servicio"
                onPress={() => setCreateModalVisible(true)}
                className="bg-primary rounded-xl px-4 py-2"
              >
                <Text style={TYPE.titleSm} className="text-primary-foreground">
                  Nueva Solicitud
                </Text>
              </Pressable>
            </View>

            {/* Search */}
            <View className="border-border bg-card mb-3 flex-row items-center rounded-lg border px-3">
              <Text className="text-muted-foreground mr-2">🔍</Text>
              <TextInput
                style={TYPE.bodyMd}
                className="text-foreground flex-1 py-2.5"
                placeholder="Buscar por título o dirección..."
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {STATUS_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => {
                    haptics.selection();
                    setStatusFilter(f.key);
                  }}
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

            {/* Urgency filter */}
            <Text style={TYPE.labelMd} className="text-muted-foreground mt-3 mb-1">
              Urgencia
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {URGENCY_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => {
                    haptics.selection();
                    setUrgencyFilter(f.key);
                  }}
                  className={`rounded-full px-3 py-1.5 ${urgencyFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
                >
                  <Text
                    style={TYPE.labelMd}
                    className={
                      urgencyFilter === f.key ? 'text-primary-foreground' : 'text-foreground'
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
            <EmptyState
              title="Sin solicitudes"
              message={
                hasActiveFilters
                  ? 'No se encontraron solicitudes con esos filtros.'
                  : 'Crea una solicitud para reportar un problema o pedir asistencia.'
              }
            />
          ) : null
        }
      />

      <CreateServiceRequestModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
}
