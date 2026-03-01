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
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSlideIn } from '@/lib/animations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiceRequest } from '@/hooks/use-service-requests';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contentStyle = useSlideIn('bottom');
  const { data: request, isLoading, error, refetch } = useServiceRequest(id);
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

  if (error && !request) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <ErrorState onRetry={refetch} />
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

      <Animated.ScrollView
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        {/* Request info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text style={TYPE.titleLg} className="text-foreground flex-1" numberOfLines={2}>
              {request.title}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center gap-2">
            <ServiceStatusBadge status={request.status} />
            <UrgencyBadge urgency={request.urgency} />
          </View>

          <Text style={TYPE.bodyMd} className="text-foreground mb-3">
            {request.description}
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Propiedad
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {request.property.address}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Fecha
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {format(new Date(request.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <CollapsibleSection title="Fotos" count={request.photos.length}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {request.photos.map((photo) => (
                <Pressable key={photo.id} onPress={() => setPreviewPhoto(photo.url)}>
                  <Image
                    source={{ uri: photo.url, cache: 'force-cache' }}
                    className="h-32 w-32 rounded-xl"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </CollapsibleSection>
        )}
      </Animated.ScrollView>

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
          <Text style={TYPE.labelLg} className="mt-4 text-white">
            Toca para cerrar
          </Text>
        </Pressable>
      </Modal>
    </View>
  );
}
