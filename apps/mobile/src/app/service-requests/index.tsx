import {
  formatRelativeDate,
  SERVICE_STATUS_PLURAL_LABELS,
  SERVICE_URGENCY_LABELS,
  type ServiceRequestPublic,
  ServiceStatus,
  type ServiceUrgency,
} from '@epde/shared';
import { Stack, useRouter } from 'expo-router';
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
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { ROUTES } from '@/lib/routes';
import { defaultScreenOptions } from '@/lib/screen-options';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: ServiceStatus.OPEN, label: SERVICE_STATUS_PLURAL_LABELS.OPEN },
  { key: ServiceStatus.IN_REVIEW, label: SERVICE_STATUS_PLURAL_LABELS.IN_REVIEW },
  { key: ServiceStatus.IN_PROGRESS, label: SERVICE_STATUS_PLURAL_LABELS.IN_PROGRESS },
  { key: ServiceStatus.RESOLVED, label: SERVICE_STATUS_PLURAL_LABELS.RESOLVED },
  { key: ServiceStatus.CLOSED, label: SERVICE_STATUS_PLURAL_LABELS.CLOSED },
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
      onPress={() => router.push(ROUTES.serviceRequest(request.id) as never)}
    >
      <View className="mb-1 flex-row items-center justify-between gap-2">
        <Text
          style={TYPE.titleSm}
          className="text-foreground flex-1 flex-shrink"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {request.title}
        </Text>
        <ServiceStatusBadge status={request.status} />
      </View>
      <Text
        style={TYPE.bodySm}
        className="text-muted-foreground mb-2"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {request.property.address}, {request.property.city}
      </Text>
      <View className="flex-row items-center justify-between gap-2">
        <UrgencyBadge urgency={request.urgency} />
        <Text
          style={TYPE.bodySm}
          className="text-muted-foreground"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
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
  const [propertyFilter, setPropertyFilter] = useState<string | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(urgencyFilter ? { urgency: urgencyFilter } : {}),
    }),
    [debouncedSearch, statusFilter, urgencyFilter],
  );

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useServiceRequests(filters);

  const allRequestsRaw = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of allRequestsRaw) {
      if (!seen.has(r.propertyId)) seen.set(r.propertyId, r.property.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ key: id, label: address }));
  }, [allRequestsRaw]);

  const requests = useMemo(
    () =>
      propertyFilter
        ? allRequestsRaw.filter((r) => r.propertyId === propertyFilter)
        : allRequestsRaw,
    [allRequestsRaw, propertyFilter],
  );

  const hasActiveFilters =
    !!debouncedSearch || !!statusFilter || !!urgencyFilter || !!propertyFilter;

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
                accessibilityLabel="Buscar solicitudes"
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
                  hitSlop={16}
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
              {STATUS_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: statusFilter === f.key }}
                  accessibilityLabel={`Filtrar por ${f.label}`}
                  onPress={() => {
                    haptics.selection();
                    setStatusFilter(f.key);
                  }}
                  style={{ minHeight: 44 }}
                  className={`items-center justify-center rounded-full px-3 py-2.5 ${statusFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
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
                  style={{ minHeight: 44 }}
                  className={`items-center justify-center rounded-full px-3 py-2 ${!propertyFilter ? 'bg-primary' : 'bg-card border-border border'}`}
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
                    style={{ minHeight: 44 }}
                    className={`items-center justify-center rounded-full px-3 py-2 ${propertyFilter === p.key ? 'bg-primary' : 'bg-card border-border border'}`}
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

            {/* Urgency filter */}
            <Text style={TYPE.labelMd} className="text-muted-foreground mt-3 mb-1">
              Urgencia
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              accessibilityRole="radiogroup"
              accessibilityLabel="Filtrar por urgencia"
            >
              {URGENCY_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: urgencyFilter === f.key }}
                  accessibilityLabel={`Filtrar por ${f.label}`}
                  onPress={() => {
                    haptics.selection();
                    setUrgencyFilter(f.key);
                  }}
                  style={{ minHeight: 44 }}
                  className={`items-center justify-center rounded-full px-3 py-2.5 ${urgencyFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
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
            hasActiveFilters ? (
              <EmptyState
                title="Sin resultados"
                message="No se encontraron solicitudes con esos filtros."
              />
            ) : (
              <ContextualEmptyState
                icon="🔧"
                title="Sin solicitudes todavía"
                message="Si ves algo raro en tu casa y no sabés qué hacer, abrí una solicitud para que EPDE lo evalúe. Ej: «apareció humedad en la pared»."
                action={{
                  label: 'Crear solicitud',
                  onPress: () => setCreateModalVisible(true),
                }}
              />
            )
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
