import { SERVICE_URGENCY_LABELS, ServiceUrgency } from '@epde/shared';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

const URGENCY_OPTIONS = [
  ServiceUrgency.LOW,
  ServiceUrgency.MEDIUM,
  ServiceUrgency.HIGH,
  ServiceUrgency.URGENT,
] as const;

const URGENCY_COLORS: Record<ServiceUrgency, string> = {
  [ServiceUrgency.LOW]: COLORS.success,
  [ServiceUrgency.MEDIUM]: COLORS.warning,
  [ServiceUrgency.HIGH]: COLORS.caution,
  [ServiceUrgency.URGENT]: COLORS.destructive,
};

export interface EditServiceRequestModalProps {
  visible: boolean;
  defaultTitle: string;
  defaultDescription: string;
  defaultUrgency: ServiceUrgency;
  onSubmit: (data: { title: string; description: string; urgency: ServiceUrgency }) => void;
  onClose: () => void;
}

export function EditServiceRequestModal({
  visible,
  defaultTitle,
  defaultDescription,
  defaultUrgency,
  onSubmit,
  onClose,
}: EditServiceRequestModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [urgency, setUrgency] = useState<ServiceUrgency>(defaultUrgency);

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setUrgency(defaultUrgency);
    }
  }, [visible, defaultTitle, defaultDescription, defaultUrgency]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      urgency,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              style={{ maxHeight: '80%' }}
            >
              <View className="bg-card mx-8 w-full max-w-sm rounded-2xl p-6">
                <Text style={TYPE.titleMd} className="text-foreground mb-4">
                  Editar Solicitud
                </Text>

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Título
                </Text>
                <TextInput
                  style={TYPE.bodyMd}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Título de la solicitud"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  returnKeyType="next"
                />

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Descripción
                </Text>
                <TextInput
                  style={[TYPE.bodyMd, { minHeight: 80, textAlignVertical: 'top' }]}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Descripción de la solicitud"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <Text style={TYPE.labelMd} className="text-foreground mb-2">
                  Urgencia
                </Text>
                <View
                  className="mb-4 flex-row gap-2"
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Urgencia"
                >
                  {URGENCY_OPTIONS.map((opt) => {
                    const isSelected = urgency === opt;
                    return (
                      <Pressable
                        key={opt}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={SERVICE_URGENCY_LABELS[opt]}
                        onPress={() => setUrgency(opt)}
                        className="flex-1 items-center rounded-lg border py-2"
                        style={{
                          borderColor: isSelected ? URGENCY_COLORS[opt] : COLORS.border,
                          backgroundColor: isSelected ? URGENCY_COLORS[opt] + '18' : 'transparent',
                        }}
                      >
                        <Text
                          style={[
                            TYPE.labelSm,
                            { color: isSelected ? URGENCY_COLORS[opt] : COLORS.mutedForeground },
                          ]}
                        >
                          {SERVICE_URGENCY_LABELS[opt]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="flex-row justify-end gap-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar"
                    onPress={onClose}
                  >
                    <Text style={TYPE.labelLg} className="text-muted-foreground px-3 py-2">
                      Cancelar
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Guardar"
                    onPress={handleSubmit}
                    className="bg-primary rounded-lg px-4 py-2"
                    disabled={!title.trim()}
                  >
                    <Text style={TYPE.labelLg} className="text-primary-foreground">
                      Guardar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
