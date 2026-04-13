import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface CompletionPhotoSectionProps {
  photoUri: string | null;
  uploadedUrl: string | null;
  isUploading: boolean;
  uploadFailed: boolean;
  onPickImage: () => void;
  onRetryUpload: () => void;
  onRemovePhoto: () => void;
}

export const CompletionPhotoSection = React.memo(function CompletionPhotoSection({
  photoUri,
  uploadedUrl: _uploadedUrl,
  isUploading,
  uploadFailed,
  onPickImage,
  onRetryUpload,
  onRemovePhoto,
}: CompletionPhotoSectionProps) {
  return (
    <>
      <Text style={TYPE.labelLg} className="text-foreground mb-1">
        Foto (opcional)
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-2">
        Foto del área inspeccionada para registro.
      </Text>
      {photoUri ? (
        <View className="mb-4">
          <View className="relative">
            <Image
              source={photoUri}
              contentFit="cover"
              transition={200}
              className="h-40 w-40 rounded-xl"
            />
            {isUploading && (
              <View className="absolute inset-0 h-40 w-40 items-center justify-center rounded-xl bg-black/40">
                <ActivityIndicator color="white" />
              </View>
            )}
            {uploadFailed && !isUploading && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Error al subir foto. Toca para reintentar"
                onPress={onRetryUpload}
                className="absolute inset-0 h-40 w-40 items-center justify-center rounded-xl bg-black/50"
              >
                <Text style={TYPE.labelMd} className="text-white">
                  Error. Reintentar
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar foto"
              onPress={onRemovePhoto}
              style={{ minWidth: 44, minHeight: 44 }}
              className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
            >
              <Text className="text-xs font-bold text-white">X</Text>
            </Pressable>
          </View>
          {isUploading && (
            <Text style={TYPE.bodySm} className="text-muted-foreground mt-1">
              Subiendo foto...
            </Text>
          )}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Subir foto"
          onPress={onPickImage}
          className="border-border flex-row items-center gap-2 rounded-xl border border-dashed px-4 py-3"
        >
          <Text style={TYPE.labelLg} className="text-muted-foreground">
            Subir foto
          </Text>
        </Pressable>
      )}
      <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 mb-4">
        Máx. 10 MB por archivo
      </Text>
    </>
  );
});
