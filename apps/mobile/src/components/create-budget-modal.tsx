import { useState } from 'react';
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
import { useCreateBudgetRequest } from '@/hooks/use-budgets';
import { useProperties } from '@/hooks/use-properties';
import type { PropertyPublic } from '@epde/shared/types';

interface CreateBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateBudgetModal({ visible, onClose }: CreateBudgetModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createBudget = useCreateBudgetRequest();
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const isSubmitting = createBudget.isPending;
  const isValid = selectedPropertyId && title.trim().length >= 3;

  const handleSubmit = () => {
    if (!selectedPropertyId || title.trim().length < 3) return;

    createBudget.mutate(
      {
        propertyId: selectedPropertyId,
        title: title.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
        onError: () => {
          Alert.alert('Error', 'No se pudo crear el presupuesto.');
        },
      },
    );
  };

  const resetForm = () => {
    setSelectedPropertyId(null);
    setTitle('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
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
            Nuevo Presupuesto
          </Text>
          <Pressable onPress={handleSubmit} disabled={!isValid || isSubmitting}>
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
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}
          >
            {properties.map((property: PropertyPublic) => (
              <Pressable
                key={property.id}
                onPress={() => setSelectedPropertyId(property.id)}
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

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Titulo
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Describir brevemente el trabajo..."
            placeholderTextColor="#4a4542"
            maxLength={200}
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3 text-sm"
          />

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Descripcion (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Mas detalles sobre lo que necesitas..."
            placeholderTextColor="#4a4542"
            multiline
            maxLength={2000}
            style={{ fontFamily: 'DMSans_400Regular', minHeight: 100, textAlignVertical: 'top' }}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3 text-sm"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
