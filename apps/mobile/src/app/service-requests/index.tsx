import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import type { ServiceRequestPublic } from '@epde/shared/types';

const STATUS_FILTERS = [
  { key: undefined, label: 'Todos' },
  { key: 'OPEN', label: 'Abiertos' },
  { key: 'IN_REVIEW', label: 'En Revision' },
  { key: 'IN_PROGRESS', label: 'En Progreso' },
  { key: 'RESOLVED', label: 'Resueltos' },
  { key: 'CLOSED', label: 'Cerrados' },
] as const;

function ServiceRequestCard({ request }: { request: ServiceRequestPublic }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-4"
      onPress={() => router.push(`/service-requests/${request.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text
          style={{ fontFamily: 'DMSans_700Bold' }}
          className="text-foreground flex-1 text-sm"
          numberOfLines={1}
        >
          {request.title}
        </Text>
        <ServiceStatusBadge status={request.status} />
      </View>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mb-2 text-xs"
      >
        {request.property.address}, {request.property.city}
      </Text>
      <View className="flex-row items-center justify-between">
        <UrgencyBadge urgency={request.urgency} />
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: es })}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ServiceRequestsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useServiceRequests(statusFilter ? { status: statusFilter } : {});

  const requests = data?.pages.flatMap((page) => page.data) ?? [];

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
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Solicitudes de Servicio',
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
        }}
      />

      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ServiceRequestCard request={item} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                onPress={() => setCreateModalVisible(true)}
                className="bg-primary rounded-xl px-4 py-2"
              >
                <Text
                  style={{ fontFamily: 'DMSans_700Bold' }}
                  className="text-primary-foreground text-sm"
                >
                  Nueva Solicitud
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {STATUS_FILTERS.map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => setStatusFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 ${statusFilter === f.key ? 'bg-primary' : 'bg-card border-border border'}`}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_500Medium' }}
                    className={`text-xs ${statusFilter === f.key ? 'text-primary-foreground' : 'text-foreground'}`}
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
              title="Sin solicitudes"
              message="Crea una solicitud para reportar un problema o pedir asistencia."
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
