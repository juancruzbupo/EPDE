import { changePasswordSchema, WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import Constants from 'expo-constants';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { AppearanceSelector } from '@/components/profile/appearance-selector';
import { PasswordChangeForm } from '@/components/profile/password-change-form';
import { UserInfoCard } from '@/components/profile/user-info-card';
import * as authApi from '@/lib/auth';
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

  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  const startEdit = useCallback(
    (field: 'name' | 'phone') => {
      setEditingField(field);
      setEditValue(field === 'name' ? (user?.name ?? '') : (user?.phone ?? ''));
    },
    [user?.name, user?.phone],
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback(async () => {
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
  }, [editingField, editValue]);

  const handleChangePassword = useCallback(async () => {
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
      haptics.success();
      Alert.alert('Listo', 'Contraseña actualizada');
    } catch {
      Alert.alert('Error', 'No se pudo cambiar la contraseña. Verificá tu contraseña actual.');
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <ScrollView className="bg-background flex-1" contentContainerStyle={{ padding: 16 }}>
      <Text style={TYPE.displaySm} className="text-foreground mb-6">
        Mi Perfil
      </Text>

      <UserInfoCard
        name={user?.name}
        email={user?.email}
        phone={user?.phone ?? undefined}
        editingField={editingField}
        editValue={editValue}
        isSaving={isSaving}
        onEditValueChange={setEditValue}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
      />

      {/* Subscription info — clients only */}
      {user?.role === 'CLIENT' && user.subscriptionExpiresAt && (
        <MobileSubscriptionInfo expiresAt={user.subscriptionExpiresAt} />
      )}

      <PasswordChangeForm
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        isChangingPassword={isChangingPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleChangePassword}
      />

      <AppearanceSelector mode={mode} onModeChange={setMode} />

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
  const { exp, isExpired, isNearExpiry, badgeColor, badgeTextColor, label } = useMemo(() => {
    const d = new Date(expiresAt);
    const days = Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60_000));
    const expired = days < 0;
    const near = !expired && days <= 7;
    return {
      exp: d,
      daysLeft: days,
      isExpired: expired,
      isNearExpiry: near,
      badgeColor: expired ? 'bg-destructive' : near ? 'bg-warning' : 'bg-success',
      badgeTextColor: expired || near ? 'text-white' : 'text-success-foreground',
      label: expired ? 'Expirada' : `${days} día${days === 1 ? '' : 's'} restantes`,
    };
  }, [expiresAt]);

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
          className="bg-primary mt-3 items-center rounded-xl py-2.5"
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
            )
          }
        >
          <Text style={TYPE.titleSm} className="text-primary-foreground">
            Contactar para renovar
          </Text>
        </Pressable>
      )}
    </View>
  );
}
