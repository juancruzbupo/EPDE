import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createServiceRequestSchema } from '@epde/shared';
import type { CreateServiceRequestInput } from '@epde/shared';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useProperties } from '@/hooks/use-properties';
import { useUploadFile } from '@/hooks/use-upload';
import type { PropertyPublic } from '@epde/shared/types';

const URGENCY_OPTIONS = [
  { key: 'LOW', label: 'Baja' },
  { key: 'MEDIUM', label: 'Media' },
  { key: 'HIGH', label: 'Alta' },
  { key: 'URGENT', label: 'Urgente' },
] as const;

interface CreateServiceRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateServiceRequestModal({ visible, onClose }: CreateServiceRequestModalProps) {
  const [photos, setPhotos] = useState<{ uri: string; uploadedUrl?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateServiceRequestInput>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: { urgency: 'MEDIUM' },
    mode: 'onChange',
  });

  const selectedPropertyId = watch('propertyId');
  const urgency = watch('urgency') ?? 'MEDIUM';
  const isSubmitting = createRequest.isPending;
  const canSubmit = isValid && !isUploading && photos.every((p) => p.uploadedUrl);

  const pickImage = () => {
    if (photos.length >= 5) {
      Alert.alert('Limite', 'Maximo 5 fotos por solicitud.');
      return;
    }

    Alert.alert('Subir foto', 'Elegir origen', [
      {
        text: 'Camara',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la camara.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            handleImageSelected(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la galeria.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            handleImageSelected(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleImageSelected = (uri: string) => {
    const photoIndex = photos.length;
    setPhotos((prev) => [...prev, { uri }]);
    setIsUploading(true);

    uploadFile.mutate(
      { uri, folder: 'service-requests' },
      {
        onSuccess: (url) => {
          setPhotos((prev) =>
            prev.map((p, i) => (i === photoIndex ? { ...p, uploadedUrl: url } : p)),
          );
          setIsUploading(false);
        },
        onError: () => {
          setPhotos((prev) => prev.filter((_, i) => i !== photoIndex));
          setIsUploading(false);
          Alert.alert('Error', 'No se pudo subir la foto.');
        },
      },
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreateServiceRequestInput) => {
    const photoUrls = photos.map((p) => p.uploadedUrl).filter((url): url is string => !!url);

    createRequest.mutate(
      {
        propertyId: data.propertyId,
        title: data.title.trim(),
        description: data.description.trim(),
        urgency: data.urgency,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setPhotos([]);
          onClose();
        },
        onError: () => {
          Alert.alert('Error', 'No se pudo crear la solicitud.');
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    setPhotos([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-background flex-1"
      >
        <View className="border-border flex-row items-center justify-between border-b px-4 py-3">
          <Pressable onPress={handleClose}>
            <Text
              style={{ fontFamily: 'DMSans_500Medium' }}
              className="text-muted-foreground text-base"
            >
              Cancelar
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground text-base">
            Nueva Solicitud
          </Text>
          <Pressable onPress={handleSubmit(onSubmit)} disabled={!canSubmit || isSubmitting}>
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className={`text-base ${!canSubmit || isSubmitting ? 'text-muted-foreground' : 'text-primary'}`}
            >
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Property selector */}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Propiedad
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 4 }}
          >
            {properties.map((property: PropertyPublic) => (
              <Pressable
                key={property.id}
                onPress={() => setValue('propertyId', property.id, { shouldValidate: true })}
                className={`rounded-xl border px-4 py-3 ${
                  selectedPropertyId === property.id
                    ? 'bg-primary border-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  style={{ fontFamily: 'DMSans_500Medium' }}
                  className={`text-sm ${
                    selectedPropertyId === property.id
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  {property.address}
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className={`text-xs ${
                    selectedPropertyId === property.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {property.city}
                </Text>
              </Pressable>
            ))}
            {properties.length === 0 && (
              <View className="py-2">
                <ActivityIndicator size="small" color="#c4704b" />
              </View>
            )}
          </ScrollView>
          {errors.propertyId && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-destructive mb-2 text-xs"
            >
              {errors.propertyId.message}
            </Text>
          )}
          {!errors.propertyId && <View className="mb-4" />}

          {/* Title */}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Titulo
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Describir brevemente el problema..."
                placeholderTextColor="#4a4542"
                maxLength={200}
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="border-border bg-card text-foreground mb-1 rounded-xl border p-3 text-sm"
              />
            )}
          />
          {errors.title && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-destructive mb-3 text-xs"
            >
              {errors.title.message}
            </Text>
          )}
          {!errors.title && <View className="mb-4" />}

          {/* Description */}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Descripcion
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Describir en detalle el problema o servicio necesario (minimo 10 caracteres)..."
                placeholderTextColor="#4a4542"
                multiline
                maxLength={2000}
                style={{
                  fontFamily: 'DMSans_400Regular',
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                className="border-border bg-card text-foreground mb-1 rounded-xl border p-3 text-sm"
              />
            )}
          />
          {errors.description && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-destructive mb-3 text-xs"
            >
              {errors.description.message}
            </Text>
          )}
          {!errors.description && <View className="mb-4" />}

          {/* Urgency */}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Urgencia
          </Text>
          <View className="mb-4 flex-row gap-2">
            {URGENCY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setValue('urgency', opt.key, { shouldValidate: true })}
                className={`flex-1 items-center rounded-xl border py-2 ${
                  urgency === opt.key ? 'bg-primary border-primary' : 'border-border bg-card'
                }`}
              >
                <Text
                  style={{ fontFamily: 'DMSans_500Medium' }}
                  className={`text-xs ${urgency === opt.key ? 'text-primary-foreground' : 'text-foreground'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Photos */}
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Fotos (opcional, max 5)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}
          >
            {photos.map((photo, index) => (
              <View key={index} className="relative">
                <Image source={{ uri: photo.uri }} className="h-24 w-24 rounded-xl" />
                {!photo.uploadedUrl && (
                  <View className="absolute inset-0 h-24 w-24 items-center justify-center rounded-xl bg-black/40">
                    <ActivityIndicator color="white" />
                  </View>
                )}
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">X</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable
                onPress={pickImage}
                className="border-border h-24 w-24 items-center justify-center rounded-xl border border-dashed"
              >
                <Text className="text-muted-foreground text-2xl">+</Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-muted-foreground text-xs"
                >
                  Foto
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
