import type { CreateServiceRequestInput } from '@epde/shared';
import { createServiceRequestSchema, SERVICE_URGENCY_LABELS, ServiceUrgency } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { confirm as confirmDialog } from '@/lib/confirm';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

import { PhotoPickerSection } from './service-request/photo-picker-section';
import { PropertyTaskSelector } from './service-request/property-task-selector';

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
      Alert.alert('Límite', 'Máximo 5 fotos por solicitud.');
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
      void confirmDialog({
        title: '¿Descartar cambios?',
        message: 'Tenés cambios sin guardar. Si salís, se pierden.',
        confirmLabel: 'Descartar cambios',
        cancelLabel: 'Seguir editando',
        destructive: true,
      }).then((ok) => {
        if (!ok) return;
        reset();
        setPhotos([]);
        setUploadingCount(0);
        onClose();
      });
      return;
    }
    reset();
    setPhotos([]);
    setUploadingCount(0);
    onClose();
  };

  const handleSelectProperty = (id: string) => {
    setValue('propertyId', id, { shouldValidate: true });
  };

  const handleSelectTask = (id: string | undefined) => {
    if (id) {
      setValue('taskId', id, { shouldValidate: true });
    } else {
      setValue('taskId', undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
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
          <View className="border-primary/30 bg-primary/5 mb-4 rounded-xl border p-3">
            <Text style={TYPE.labelLg} className="text-foreground mb-1">
              💡 ¿Cuándo conviene una solicitud de servicio?
            </Text>
            <Text style={TYPE.bodySm} className="text-foreground">
              Cuando ves algo y no estás seguro de qué es. Ej: "apareció humedad en la pared, no sé
              si es filtración o condensación". EPDE evalúa el caso y, si hace falta, te manda una
              cotización.
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground mt-2">
              Si ya sabés exactamente qué reparar, pedí un presupuesto directo.
            </Text>
          </View>

          <PropertyTaskSelector
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handleSelectProperty}
            propertyError={errors.propertyId?.message}
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
          />

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

          <PhotoPickerSection
            photos={photos}
            maxPhotos={5}
            onPickImage={pickImage}
            onRemovePhoto={removePhoto}
          />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
