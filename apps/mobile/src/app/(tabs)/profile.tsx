import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/auth-store';
import { TYPE } from '@/lib/fonts';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Nombre
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {user?.name ?? '-'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Email
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {user?.email ?? '-'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Teléfono
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {user?.phone ?? 'No registrado'}
            </Text>
          </View>
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
