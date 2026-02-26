import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiceRequest } from '@/hooks/use-service-requests';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading, refetch } = useServiceRequest(id);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color="#c4704b" />
      </View>
    );
  }

  if (!request) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <EmptyState title="No encontrada" message="La solicitud no existe o fue eliminada." />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Solicitud',
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        {/* Request info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className="text-foreground flex-1 text-lg"
              numberOfLines={2}
            >
              {request.title}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center gap-2">
            <ServiceStatusBadge status={request.status} />
            <UrgencyBadge urgency={request.urgency} />
          </View>

          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-foreground mb-3 text-sm"
          >
            {request.description}
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Propiedad
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {request.property.address}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Fecha
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {format(new Date(request.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <>
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className="text-foreground mb-2 text-base"
            >
              Fotos ({request.photos.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16 }}
            >
              {request.photos.map((photo) => (
                <Pressable key={photo.id} onPress={() => setPreviewPhoto(photo.url)}>
                  <Image
                    source={{ uri: photo.url }}
                    className="h-32 w-32 rounded-xl"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      {/* Full-screen photo preview */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewPhoto(null)}
        >
          {previewPhoto && (
            <Image
              source={{ uri: previewPhoto }}
              style={{ width: screenWidth * 0.9, height: screenHeight * 0.7 }}
              resizeMode="contain"
            />
          )}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="mt-4 text-base text-white">
            Toca para cerrar
          </Text>
        </Pressable>
      </Modal>
    </View>
  );
}
