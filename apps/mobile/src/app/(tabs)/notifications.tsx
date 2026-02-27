import { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import type { NotificationPublic } from '@epde/shared/types';

const TYPE_ICONS: Record<string, string> = {
  TASK_REMINDER: '\u{1F552}',
  BUDGET_UPDATE: '\u{1F4CB}',
  SERVICE_UPDATE: '\u{1F527}',
  SYSTEM: '\u{1F514}',
};

const TYPE_LABELS: Record<string, string> = {
  TASK_REMINDER: 'Recordatorio',
  BUDGET_UPDATE: 'Presupuesto',
  SERVICE_UPDATE: 'Servicio',
  SYSTEM: 'Sistema',
};

function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationPublic;
  onPress: () => void;
}) {
  const icon = TYPE_ICONS[notification.type] ?? '\u{1F514}';
  const typeLabel = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <Pressable
      onPress={onPress}
      className={`border-border mb-2 rounded-xl border p-4 ${notification.read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}
    >
      <View className="flex-row items-start gap-3">
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text
              style={{ fontFamily: notification.read ? 'DMSans_500Medium' : 'DMSans_700Bold' }}
              className="text-foreground flex-1 text-sm"
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.read && <View className="bg-primary ml-2 h-2 w-2 rounded-full" />}
          </View>
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground mb-1 text-sm"
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text
              style={{ fontFamily: 'DMSans_500Medium' }}
              className="text-muted-foreground text-xs"
            >
              {typeLabel}
            </Text>
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-xs"
            >
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

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

  const handleNotificationPress = (notification: NotificationPublic) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <FlatList
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NotificationCard notification={item} onPress={() => handleNotificationPress(item)} />
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              className="text-foreground text-2xl"
            >
              Avisos
            </Text>
            {(unreadCount ?? 0) > 0 && (
              <Pressable
                onPress={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="bg-card border-border rounded-xl border px-3 py-1.5"
              >
                <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-primary text-xs">
                  Marcar todas como leidas
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      }
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState title="Sin notificaciones" message="No tienes avisos por el momento." />
        ) : null
      }
    />
  );
}
