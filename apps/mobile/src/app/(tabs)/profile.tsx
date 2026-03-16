import { changePasswordSchema } from '@epde/shared';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as authApi from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const startEdit = (field: 'name' | 'phone') => {
    setEditingField(field);
    setEditValue(field === 'name' ? (user?.name ?? '') : (user?.phone ?? ''));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingField) return;
    setIsSaving(true);
    try {
      const dto = editingField === 'name' ? { name: editValue } : { phone: editValue };
      const updated = await authApi.updateProfile(dto);
      useAuthStore.setState({ user: updated });
      setEditingField(null);
      setEditValue('');
      Alert.alert('Listo', 'Perfil actualizado');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Completá ambos campos');
      return;
    }
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!result.success) {
      Alert.alert('Error', result.error.issues[0]?.message ?? 'Contraseña inválida');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Listo', 'Contraseña actualizada');
    } catch {
      Alert.alert('Error', 'No se pudo cambiar la contraseña. Verificá tu contraseña actual.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerStyle={{ padding: 16 }}>
      <Text style={TYPE.displaySm} className="text-foreground mb-6">
        Mi Perfil
      </Text>

      {/* User info card */}
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <View className="mb-4 items-center">
          <View className="bg-primary/10 mb-3 h-20 w-20 items-center justify-center rounded-full">
            <Text style={{ fontSize: 32 }}>{'\u{1F464}'}</Text>
          </View>
          <Text style={TYPE.titleLg} className="text-foreground">
            {user?.name ?? 'Usuario'}
          </Text>
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            {user?.email ?? ''}
          </Text>
        </View>

        <View className="border-border gap-3 border-t pt-3">
          {/* Name field */}
          <View className="flex-row items-center justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Nombre
            </Text>
            {editingField === 'name' ? (
              <View className="ml-4 flex-1 flex-row items-center gap-2">
                <TextInput
                  value={editValue}
                  onChangeText={setEditValue}
                  className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-1.5"
                  style={TYPE.bodyMd}
                  autoFocus
                />
                <Pressable onPress={saveEdit} disabled={isSaving}>
                  <Text style={TYPE.labelMd} className="text-primary">
                    {isSaving ? '...' : 'OK'}
                  </Text>
                </Pressable>
                <Pressable onPress={cancelEdit}>
                  <Text style={TYPE.labelMd} className="text-muted-foreground">
                    X
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => startEdit('name')} className="flex-row items-center gap-2">
                <Text style={TYPE.labelLg} className="text-foreground">
                  {user?.name ?? '-'}
                </Text>
                <Text style={TYPE.labelMd} className="text-primary">
                  Editar
                </Text>
              </Pressable>
            )}
          </View>

          {/* Email field (read-only) */}
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Email
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {user?.email ?? '-'}
            </Text>
          </View>

          {/* Phone field */}
          <View className="flex-row items-center justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Teléfono
            </Text>
            {editingField === 'phone' ? (
              <View className="ml-4 flex-1 flex-row items-center gap-2">
                <TextInput
                  value={editValue}
                  onChangeText={setEditValue}
                  className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-1.5"
                  style={TYPE.bodyMd}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <Pressable onPress={saveEdit} disabled={isSaving}>
                  <Text style={TYPE.labelMd} className="text-primary">
                    {isSaving ? '...' : 'OK'}
                  </Text>
                </Pressable>
                <Pressable onPress={cancelEdit}>
                  <Text style={TYPE.labelMd} className="text-muted-foreground">
                    X
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => startEdit('phone')} className="flex-row items-center gap-2">
                <Text style={TYPE.labelLg} className="text-foreground">
                  {user?.phone ?? 'No registrado'}
                </Text>
                <Text style={TYPE.labelMd} className="text-primary">
                  Editar
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Change password card */}
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
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              secureTextEntry
              className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
              style={TYPE.bodyMd}
              placeholderTextColor={COLORS.mutedForeground}
            />
          </View>
          <View>
            <Text style={TYPE.labelMd} className="text-foreground mb-1">
              Nueva contraseña *
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mín. 8, mayúscula, minúscula, número"
              secureTextEntry
              className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
              style={TYPE.bodyMd}
              placeholderTextColor={COLORS.mutedForeground}
            />
          </View>
          <Pressable
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            className="bg-primary items-center rounded-lg py-2.5"
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

      {/* App info */}
      <View className="border-border bg-card mb-6 rounded-xl border p-4">
        <Text style={TYPE.titleSm} className="text-foreground mb-2">
          Información de la App
        </Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Versión
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Plataforma
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              EPDE Mobile
            </Text>
          </View>
        </View>
      </View>

      {/* Logout button */}
      <Pressable onPress={handleLogout} className="bg-destructive items-center rounded-xl py-3">
        <Text style={TYPE.titleMd} className="text-destructive-foreground">
          Cerrar Sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
}
