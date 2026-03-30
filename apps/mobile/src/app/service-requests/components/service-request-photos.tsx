import type { ServiceRequestPhotoPublic } from '@epde/shared';
import { Image } from 'expo-image';
import { Dimensions, Modal, Pressable, ScrollView, Text } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ServiceRequestPhotosProps {
  photos: ServiceRequestPhotoPublic[];
  previewPhoto: string | null;
  onPreview: (url: string | null) => void;
}

export function ServiceRequestPhotos({
  photos,
  previewPhoto,
  onPreview,
}: ServiceRequestPhotosProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <CollapsibleSection title="Fotos" count={photos.length}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="button"
              accessibilityLabel="Ver foto"
              onPress={() => onPreview(photo.url)}
            >
              <Image
                source={photo.url}
                contentFit="cover"
                transition={200}
                className="h-32 w-32 rounded-xl"
                accessibilityLabel="Foto de solicitud de servicio"
              />
            </Pressable>
          ))}
        </ScrollView>
      </CollapsibleSection>

      {/* Full-screen photo preview */}
      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        accessibilityViewIsModal={true}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => onPreview(null)}
        >
          {previewPhoto && (
            <Image
              source={previewPhoto}
              contentFit="contain"
              transition={200}
              style={{ width: screenWidth * 0.9, height: screenHeight * 0.7 }}
            />
          )}
          <Text style={TYPE.labelLg} className="mt-4 text-white">
            Toca para cerrar
          </Text>
        </Pressable>
      </Modal>
    </>
  );
}
