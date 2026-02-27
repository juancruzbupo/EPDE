import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBudgetRequestSchema } from '@epde/shared';
import type { CreateBudgetRequestInput } from '@epde/shared';
import { useCreateBudgetRequest } from '@/hooks/use-budgets';
import { useProperties } from '@/hooks/use-properties';
import type { PropertyPublic } from '@epde/shared/types';

interface CreateBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateBudgetModal({ visible, onClose }: CreateBudgetModalProps) {
  const insets = useSafeAreaInsets();
  const createBudget = useCreateBudgetRequest();
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<CreateBudgetRequestInput>({
    resolver: zodResolver(createBudgetRequestSchema),
    mode: 'onChange',
  });

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
          reset();
          onClose();
        },
        onError: () => {
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
          <Pressable onPress={handleClose}>
            <Text
              style={{ fontFamily: 'DMSans_500Medium' }}
              className="text-muted-foreground text-base"
            >
              Cancelar
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground text-base">
            Nuevo Presupuesto
          </Text>
          <Pressable onPress={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting}>
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className={`text-base ${!isValid || isSubmitting ? 'text-muted-foreground' : 'text-primary'}`}
            >
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
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
                placeholder="Describir brevemente el trabajo..."
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

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Descripcion (opcional)
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
                placeholderTextColor="#4a4542"
                multiline
                maxLength={2000}
                style={{
                  fontFamily: 'DMSans_400Regular',
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                className="border-border bg-card text-foreground mb-4 rounded-xl border p-3 text-sm"
              />
            )}
          />
          {errors.description && (
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-destructive text-xs">
              {errors.description.message}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
