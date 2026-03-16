import type { CreateBudgetRequestInput, PropertyPublic } from '@epde/shared';
import { createBudgetRequestSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
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

import { useCreateBudgetRequest } from '@/hooks/use-budgets';
import { useDraft } from '@/hooks/use-draft';
import { useProperties } from '@/hooks/use-properties';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface CreateBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateBudgetModal({ visible, onClose }: CreateBudgetModalProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = useSlideIn('bottom');
  const createBudget = useCreateBudgetRequest();
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const form = useForm<CreateBudgetRequestInput>({
    resolver: zodResolver(createBudgetRequestSchema),
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

  const { clearDraft } = useDraft('draft:budget:create', form, visible);

  const selectedPropertyId = watch('propertyId');
  const isSubmitting = createBudget.isPending;

  const onSubmit = (data: CreateBudgetRequestInput) => {
    createBudget.mutate(
      {
        propertyId: data.propertyId,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          clearDraft();
          reset();
          onClose();
        },
        onError: () => {
          haptics.error();
          Alert.alert('Error', 'No se pudo crear el presupuesto.');
        },
      },
    );
  };

  const handleClose = () => {
    if (isDirty) {
      Alert.alert('Descartar cambios?', 'Tenés cambios sin guardar.', [
        { text: 'Seguir editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            reset();
            onClose();
          },
        },
      ]);
      return;
    }
    reset();
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
            Nuevo Presupuesto
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear presupuesto"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
          >
            <Text
              style={TYPE.titleMd}
              className={!isValid || isSubmitting ? 'text-muted-foreground' : 'text-primary'}
            >
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Text>
          </Pressable>
        </View>

        <Animated.ScrollView style={contentStyle} contentContainerStyle={{ padding: 16 }}>
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
                placeholder="Describir brevemente el trabajo..."
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

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Descripción
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Mas detalles sobre lo que necesitas..."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                maxLength={2000}
                style={[TYPE.bodyMd, { minHeight: 100, textAlignVertical: 'top' }]}
                className="border-border bg-card text-foreground mb-4 rounded-xl border p-3"
              />
            )}
          />
          {errors.description && (
            <Text style={TYPE.bodySm} className="text-destructive">
              {errors.description.message}
            </Text>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
