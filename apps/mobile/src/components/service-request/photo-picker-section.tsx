import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface PhotoItem {
  uri: string;
  uploadedUrl?: string;
}

interface PhotoPickerSectionProps {
  photos: PhotoItem[];
  maxPhotos: number;
  onPickImage: () => void;
  onRemovePhoto: (index: number) => void;
}

export const PhotoPickerSection = React.memo(function PhotoPickerSection({
  photos,
  maxPhotos,
  onPickImage,
  onRemovePhoto,
}: PhotoPickerSectionProps) {
  return (
    <>
      <Text style={TYPE.labelLg} className="text-foreground mb-2">
        Fotos (opcional, max {maxPhotos})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 16 }}
      >
        {photos.map((photo, index) => (
          <View key={photo.uri} className="relative">
            <Image
              source={photo.uri}
              contentFit="cover"
              transition={200}
              className="h-24 w-24 rounded-xl"
            />
            {!photo.uploadedUrl && (
              <View
                className="absolute inset-0 h-24 w-24 items-center justify-center rounded-xl bg-black/40"
                accessibilityLabel="Subiendo foto"
                accessibilityLiveRegion="polite"
              >
                <ActivityIndicator color="white" />
                <Text style={{ color: 'white', fontSize: 10, marginTop: 4 }}>Subiendo...</Text>
              </View>
            )}
            <Pressable
              onPress={() => onRemovePhoto(index)}
              accessibilityRole="button"
              accessibilityLabel="Eliminar foto"
              style={{ minWidth: 44, minHeight: 44 }}
              className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
            >
              <Text className="text-xs font-bold text-white">X</Text>
            </Pressable>
          </View>
        ))}
        {photos.length < maxPhotos && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar foto"
            onPress={onPickImage}
            className="border-border h-24 w-24 items-center justify-center rounded-xl border border-dashed"
          >
            <Text style={TYPE.displayLg} className="text-muted-foreground">
              +
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Foto
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-4">
        Máx. 10 MB por archivo
      </Text>
    </>
  );
});
