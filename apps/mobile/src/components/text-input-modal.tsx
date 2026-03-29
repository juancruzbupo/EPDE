import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

interface TextInputModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function TextInputModal({
  visible,
  title,
  placeholder,
  defaultValue = '',
  onSubmit,
  onClose,
}: TextInputModalProps) {
  const [value, setValue] = useState(defaultValue);

  // Reset internal state when modal opens with a new defaultValue
  useEffect(() => {
    if (visible) setValue(defaultValue);
  }, [visible, defaultValue]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
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
            <View className="bg-card mx-8 w-full max-w-sm rounded-2xl p-6">
              <Text style={TYPE.titleMd} className="text-foreground mb-4">
                {title}
              </Text>
              <TextInput
                style={TYPE.bodyMd}
                className="border-border text-foreground mb-4 rounded-lg border px-3 py-2.5"
                placeholder={placeholder}
                placeholderTextColor={COLORS.mutedForeground}
                value={value}
                onChangeText={setValue}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
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
                  disabled={!value.trim()}
                >
                  <Text style={TYPE.labelLg} className="text-primary-foreground">
                    Guardar
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
