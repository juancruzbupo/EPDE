import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

interface PasswordChangeFormProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isChangingPassword: boolean;
  onCurrentPasswordChange: (text: string) => void;
  onNewPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onSubmit: () => void;
}

export const PasswordChangeForm = React.memo(function PasswordChangeForm({
  currentPassword,
  newPassword,
  confirmPassword,
  isChangingPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: PasswordChangeFormProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-foreground mb-3">
        Cambiar Contraseña
      </Text>
      <View className="gap-3">
        <View>
          <Text style={TYPE.labelMd} className="text-foreground mb-1">
            Contraseña actual *
          </Text>
          <TextInput
            accessibilityLabel="Contraseña actual"
            value={currentPassword}
            onChangeText={onCurrentPasswordChange}
            placeholder="Contraseña actual"
            secureTextEntry
            className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
            style={TYPE.bodyMd}
            placeholderTextColor={COLORS.mutedForeground}
            returnKeyType="next"
          />
        </View>
        <View>
          <Text style={TYPE.labelMd} className="text-foreground mb-1">
            Nueva contraseña *
          </Text>
          <TextInput
            accessibilityLabel="Nueva contraseña"
            value={newPassword}
            onChangeText={onNewPasswordChange}
            placeholder="Mín. 8, mayúscula, minúscula, número"
            secureTextEntry
            className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
            style={TYPE.bodyMd}
            placeholderTextColor={COLORS.mutedForeground}
            returnKeyType="next"
          />
        </View>
        <View>
          <Text style={TYPE.labelMd} className="text-foreground mb-1">
            Confirmar contraseña *
          </Text>
          <TextInput
            accessibilityLabel="Confirmar nueva contraseña"
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholder="Repetir nueva contraseña"
            secureTextEntry
            className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
            style={TYPE.bodyMd}
            placeholderTextColor={COLORS.mutedForeground}
            returnKeyType="done"
          />
        </View>
        <Pressable
          onPress={onSubmit}
          disabled={isChangingPassword}
          className="bg-primary items-center rounded-lg py-2.5"
          style={{ opacity: isChangingPassword ? 0.5 : 1 }}
          accessibilityLabel="Cambiar contraseña"
          accessibilityRole="button"
          accessibilityState={{ disabled: isChangingPassword }}
        >
          {isChangingPassword ? (
            <ActivityIndicator color={COLORS.primaryForeground} size="small" />
          ) : (
            <Text style={TYPE.labelLg} className="text-primary-foreground">
              Cambiar Contraseña
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
});
