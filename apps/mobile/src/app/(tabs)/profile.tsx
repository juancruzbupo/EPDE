import { changePasswordSchema, WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as authApi from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
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
      setConfirmPassword('');
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
                <Pressable
                  onPress={saveEdit}
                  disabled={isSaving}
                  accessibilityLabel="Guardar"
                  accessibilityRole="button"
                >
                  <Text style={TYPE.labelMd} className="text-primary">
                    {isSaving ? '...' : 'OK'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={cancelEdit}
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text style={TYPE.labelMd} className="text-muted-foreground">
                    X
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => startEdit('name')}
                className="flex-row items-center gap-2"
                accessibilityLabel="Editar nombre"
                accessibilityRole="button"
              >
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
                <Pressable
                  onPress={saveEdit}
                  disabled={isSaving}
                  accessibilityLabel="Guardar"
                  accessibilityRole="button"
                >
                  <Text style={TYPE.labelMd} className="text-primary">
                    {isSaving ? '...' : 'OK'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={cancelEdit}
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text style={TYPE.labelMd} className="text-muted-foreground">
                    X
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => startEdit('phone')}
                className="flex-row items-center gap-2"
                accessibilityLabel="Editar teléfono"
                accessibilityRole="button"
              >
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

      {/* Subscription info — clients only */}
      {user?.role === 'CLIENT' && user.subscriptionExpiresAt && (
        <MobileSubscriptionInfo expiresAt={user.subscriptionExpiresAt} />
      )}

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
              returnKeyType="next"
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
              returnKeyType="next"
            />
          </View>
          <View>
            <Text style={TYPE.labelMd} className="text-foreground mb-1">
              Confirmar contraseña *
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repetir nueva contraseña"
              secureTextEntry
              className="border-border bg-background text-foreground rounded-lg border px-3 py-2.5"
              style={TYPE.bodyMd}
              placeholderTextColor={COLORS.mutedForeground}
              returnKeyType="done"
            />
          </View>
          <Pressable
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            className="bg-primary items-center rounded-lg py-2.5"
            accessibilityLabel="Cambiar contraseña"
            accessibilityRole="button"
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

      {/* Apariencia */}
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <Text style={TYPE.titleSm} className="text-foreground mb-3">
          Apariencia
        </Text>
        <View className="gap-2">
          {(['auto', 'light', 'dark'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={
                option === 'auto' ? 'Automático (sistema)' : option === 'light' ? 'Claro' : 'Oscuro'
              }
              accessibilityState={{ selected: mode === option }}
              onPress={() => {
                setMode(option);
                haptics.selection();
              }}
              className={`flex-row items-center justify-between rounded-lg p-3 ${mode === option ? 'bg-primary/10' : 'bg-muted/50'}`}
            >
              <Text style={TYPE.bodyMd} className="text-foreground">
                {option === 'auto'
                  ? 'Automático (sistema)'
                  : option === 'light'
                    ? 'Claro'
                    : 'Oscuro'}
              </Text>
              {mode === option && <View className="bg-primary h-3 w-3 rounded-full" />}
            </Pressable>
          ))}
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
      <Pressable
        onPress={handleLogout}
        className="bg-destructive items-center rounded-xl py-3"
        accessibilityLabel="Cerrar sesión"
        accessibilityRole="button"
      >
        <Text style={TYPE.titleMd} className="text-destructive-foreground">
          Cerrar Sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function MobileSubscriptionInfo({ expiresAt }: { expiresAt: string }) {
  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (24 * 60 * 60_000));
  const isExpired = daysLeft < 0;
  const isNearExpiry = !isExpired && daysLeft <= 7;

  const badgeColor = isExpired ? 'bg-destructive' : isNearExpiry ? 'bg-warning' : 'bg-success';
  const badgeTextColor = isExpired || isNearExpiry ? 'text-white' : 'text-success-foreground';
  const label = isExpired ? 'Expirada' : `${daysLeft} día${daysLeft === 1 ? '' : 's'} restantes`;

  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text style={TYPE.titleSm} className="text-foreground">
          Tu suscripción
        </Text>
        <View className={`${badgeColor} rounded-full px-2.5 py-0.5`}>
          <Text style={TYPE.labelSm} className={badgeTextColor}>
            {label}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-6">
        <View>
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Vencimiento
          </Text>
          <Text style={TYPE.bodyMd} className="text-foreground">
            {exp.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View>
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Estado
          </Text>
          <Text style={TYPE.bodyMd} className="text-foreground">
            {isExpired ? 'Sin acceso' : 'Acceso completo'}
          </Text>
        </View>
      </View>
      {(isExpired || isNearExpiry) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Contactar para renovar suscripción"
          className="mt-3"
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
            )
          }
        >
          <Text style={TYPE.labelMd} className="text-primary">
            Contactar para renovar →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
