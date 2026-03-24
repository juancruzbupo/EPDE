import type { CreateServiceRequestInput, PropertyPublic, TaskListItem } from '@epde/shared';
import { createServiceRequestSchema, SERVICE_URGENCY_LABELS, ServiceUrgency } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDraft } from '@/hooks/use-draft';
import { useAllTasks } from '@/hooks/use-plans';
import { useProperties } from '@/hooks/use-properties';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

const URGENCY_OPTIONS = [
  { key: ServiceUrgency.LOW, label: SERVICE_URGENCY_LABELS.LOW },
  { key: ServiceUrgency.MEDIUM, label: SERVICE_URGENCY_LABELS.MEDIUM },
  { key: ServiceUrgency.HIGH, label: SERVICE_URGENCY_LABELS.HIGH },
  { key: ServiceUrgency.URGENT, label: SERVICE_URGENCY_LABELS.URGENT },
] as const;

interface CreateServiceRequestModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-select property when opening from task detail */
  defaultPropertyId?: string;
  /** Pre-select linked task when opening from task detail */
  defaultTaskId?: string;
  /** Pre-fill title when opening from task detail */
  defaultTitle?: string;
  /** Pre-fill description when opening from task detail */
  defaultDescription?: string;
}

export function CreateServiceRequestModal({
  visible,
  onClose,
  defaultPropertyId,
  defaultTaskId,
  defaultTitle,
  defaultDescription,
}: CreateServiceRequestModalProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = useSlideIn('bottom');
  const [photos, setPhotos] = useState<{ uri: string; uploadedUrl?: string }[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const createRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const form = useForm<CreateServiceRequestInput>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: { urgency: 'MEDIUM' },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = form;

  // Disable draft when pre-filling from task context
  const hasDefaults = !!(defaultPropertyId || defaultTaskId || defaultTitle || defaultDescription);
  const { clearDraft } = useDraft('draft:service-request:create', form, visible && !hasDefaults);

  // Pre-fill defaults when opened from task detail
  useEffect(() => {
    if (!visible) return;
    if (defaultPropertyId) setValue('propertyId', defaultPropertyId, { shouldValidate: true });
    if (defaultTaskId) setValue('taskId', defaultTaskId, { shouldValidate: true });
    if (defaultTitle) setValue('title', defaultTitle, { shouldValidate: true });
    if (defaultDescription) setValue('description', defaultDescription, { shouldValidate: true });
  }, [visible, defaultPropertyId, defaultTaskId, defaultTitle, defaultDescription, setValue]);

  const selectedPropertyId = watch('propertyId');
  const selectedTaskId = watch('taskId');
  const urgency = watch('urgency') ?? 'MEDIUM';
  const isSubmitting = createRequest.isPending;
  const canSubmit = isValid && uploadingCount === 0 && photos.every((p) => p.uploadedUrl);

  // Fetch tasks for the selected property
  const { data: propertyTasks } = useAllTasks(
    selectedPropertyId ? { propertyId: selectedPropertyId } : undefined,
  );
  const tasks = selectedPropertyId ? (propertyTasks ?? []) : [];

  // Clear taskId when property changes (skip when pre-filling from task context)
  useEffect(() => {
    if (!defaultTaskId) {
      setValue('taskId', undefined);
    }
  }, [selectedPropertyId, defaultTaskId, setValue]);

  // Re-apply defaultTaskId after tasks load (select needs options available)
  useEffect(() => {
    if (visible && defaultTaskId && propertyTasks && propertyTasks.length > 0) {
      setValue('taskId', defaultTaskId, { shouldValidate: true });
    }
  }, [visible, defaultTaskId, propertyTasks, setValue]);

  const pickImage = () => {
    if (photos.length >= 5) {
      Alert.alert('Limite', 'Maximo 5 fotos por solicitud.');
      return;
    }

    Alert.alert('Subir foto', 'Elegir origen', [
      {
        text: 'Cámara',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
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
        text: 'Galería',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.');
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
    setPhotos((prev) => [...prev, { uri }]);
    setUploadingCount((c) => c + 1);

    uploadFile.mutate(
      { uri, folder: 'service-requests' },
      {
        onSuccess: (url) => {
          setPhotos((prev) => prev.map((p) => (p.uri === uri ? { ...p, uploadedUrl: url } : p)));
          setUploadingCount((c) => c - 1);
        },
        onError: () => {
          setPhotos((prev) => prev.filter((p) => p.uri !== uri));
          setUploadingCount((c) => c - 1);
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
        taskId: data.taskId,
        title: data.title.trim(),
        description: data.description.trim(),
        urgency: data.urgency,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          clearDraft();
          reset();
          setPhotos([]);
          onClose();
        },
        onError: () => {
          haptics.error();
          Alert.alert('Error', 'No se pudo crear la solicitud.');
        },
      },
    );
  };

  const handleClose = () => {
    if (isDirty || photos.length > 0) {
      Alert.alert('Descartar cambios?', 'Tenés cambios sin guardar.', [
        { text: 'Seguir editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            reset();
            setPhotos([]);
            setUploadingCount(0);
            onClose();
          },
        },
      ]);
      return;
    }
    reset();
    setPhotos([]);
    setUploadingCount(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-background flex-1"
      >
        <View
          style={{ paddingTop: insets.top }}
          className="border-border flex-row items-center justify-between border-b px-4 py-3"
        >
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={handleClose}>
            <Text style={TYPE.labelLg} className="text-muted-foreground">
              Cancelar
            </Text>
          </Pressable>
          <Text style={TYPE.titleMd} className="text-foreground">
            Nueva Solicitud
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear solicitud"
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit || isSubmitting}
          >
            <Text
              style={TYPE.titleMd}
              className={!canSubmit || isSubmitting ? 'text-muted-foreground' : 'text-primary'}
            >
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Text>
          </Pressable>
        </View>

        <Animated.ScrollView style={contentStyle} contentContainerStyle={{ padding: 16 }}>
          <Text style={TYPE.bodySm} className="text-muted-foreground mb-4">
            Describí el problema. El equipo de EPDE evaluará tu solicitud.
          </Text>

          {/* Property selector */}
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
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
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedPropertyId === property.id }}
                accessibilityLabel={`${property.address}, ${property.city}`}
                onPress={() => setValue('propertyId', property.id, { shouldValidate: true })}
                className={`rounded-xl border px-4 py-3 ${
                  selectedPropertyId === property.id
                    ? 'bg-primary border-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  style={TYPE.labelLg}
                  className={
                    selectedPropertyId === property.id
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }
                  numberOfLines={1}
                >
                  {property.address}
                </Text>
                <Text
                  style={TYPE.bodySm}
                  className={
                    selectedPropertyId === property.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }
                >
                  {property.city}
                </Text>
              </Pressable>
            ))}
            {properties.length === 0 && (
              <View className="py-2">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </ScrollView>
          {errors.propertyId && (
            <Text style={TYPE.bodySm} className="text-destructive mb-2">
              {errors.propertyId.message}
            </Text>
          )}
          {!errors.propertyId && <View className="mb-4" />}

          {/* Task selector — shown when property has tasks */}
          {selectedPropertyId && tasks.length > 0 && (
            <>
              <Text style={TYPE.labelLg} className="text-foreground mb-2">
                Tarea relacionada (opcional)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 16 }}
              >
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !selectedTaskId }}
                  accessibilityLabel="Ninguna tarea"
                  onPress={() => setValue('taskId', undefined)}
                  className={`rounded-xl border px-4 py-2 ${
                    !selectedTaskId ? 'bg-primary border-primary' : 'border-border bg-card'
                  }`}
                >
                  <Text
                    style={TYPE.labelMd}
                    className={!selectedTaskId ? 'text-primary-foreground' : 'text-foreground'}
                  >
                    Ninguna
                  </Text>
                </Pressable>
                {tasks.map((task: TaskListItem) => (
                  <Pressable
                    key={task.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedTaskId === task.id }}
                    accessibilityLabel={task.name}
                    onPress={() => setValue('taskId', task.id, { shouldValidate: true })}
                    className={`rounded-xl border px-4 py-2 ${
                      selectedTaskId === task.id
                        ? 'bg-primary border-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      style={TYPE.labelMd}
                      className={
                        selectedTaskId === task.id ? 'text-primary-foreground' : 'text-foreground'
                      }
                      numberOfLines={1}
                    >
                      {task.name}
                    </Text>
                    <Text
                      style={TYPE.bodySm}
                      className={
                        selectedTaskId === task.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }
                    >
                      {task.category.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Title */}
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Título *
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
                placeholderTextColor={COLORS.mutedForeground}
                maxLength={200}
                style={TYPE.bodyMd}
                className="border-border bg-card text-foreground mb-1 rounded-xl border p-3"
              />
            )}
          />
          {errors.title && (
            <Text style={TYPE.bodySm} className="text-destructive mb-3">
              {errors.title.message}
            </Text>
          )}
          {!errors.title && <View className="mb-4" />}

          {/* Description */}
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Descripción *
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
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                maxLength={2000}
                style={[TYPE.bodyMd, { minHeight: 100, textAlignVertical: 'top' }]}
                className="border-border bg-card text-foreground mb-1 rounded-xl border p-3"
              />
            )}
          />
          {errors.description && (
            <Text style={TYPE.bodySm} className="text-destructive mb-3">
              {errors.description.message}
            </Text>
          )}
          {!errors.description && <View className="mb-4" />}

          {/* Urgency */}
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Urgencia
          </Text>
          <View
            className="mb-4 flex-row gap-2"
            accessibilityRole="radiogroup"
            accessibilityLabel="Urgencia"
          >
            {URGENCY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: urgency === opt.key }}
                accessibilityLabel={opt.label}
                onPress={() => setValue('urgency', opt.key, { shouldValidate: true })}
                className={`flex-1 items-center rounded-xl border py-2 ${
                  urgency === opt.key ? 'bg-primary border-primary' : 'border-border bg-card'
                }`}
              >
                <Text
                  style={TYPE.labelMd}
                  className={urgency === opt.key ? 'text-primary-foreground' : 'text-foreground'}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Photos */}
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Fotos (opcional, max 5)
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
                  <View className="absolute inset-0 h-24 w-24 items-center justify-center rounded-xl bg-black/40">
                    <ActivityIndicator color="white" />
                  </View>
                )}
                <Pressable
                  onPress={() => removePhoto(index)}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar foto"
                  className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">X</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar foto"
                onPress={pickImage}
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
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
