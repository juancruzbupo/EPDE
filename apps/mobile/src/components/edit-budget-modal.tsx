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

export interface EditBudgetModalProps {
  visible: boolean;
  defaultTitle: string;
  defaultDescription: string | null;
  onSubmit: (data: { title: string; description: string | null }) => void;
  onClose: () => void;
}

export function EditBudgetModal({
  visible,
  defaultTitle,
  defaultDescription,
  onSubmit,
  onClose,
}: EditBudgetModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? '');

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setDescription(defaultDescription ?? '');
    }
  }, [visible, defaultTitle, defaultDescription]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
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
                  Editar Presupuesto
                </Text>

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Título
                </Text>
                <TextInput
                  style={TYPE.bodyMd}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Título del presupuesto"
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
                  className="border-border text-foreground mb-4 rounded-lg border px-3 py-2.5"
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

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
