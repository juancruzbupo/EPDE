import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', 'Estas seguro de que quieres cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesion',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerStyle={{ padding: 16 }}>
      <Text
        style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
        className="text-foreground mb-6 text-2xl"
      >
        Mi Perfil
      </Text>

      {/* User info card */}
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <View className="mb-4 items-center">
          <View className="bg-primary/10 mb-3 h-20 w-20 items-center justify-center rounded-full">
            <Text style={{ fontSize: 32 }}>{'\u{1F464}'}</Text>
          </View>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground text-lg">
            {user?.name ?? 'Usuario'}
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground text-sm"
          >
            {user?.email ?? ''}
          </Text>
        </View>

        <View className="border-border gap-3 border-t pt-3">
          <View className="flex-row justify-between">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-sm"
            >
              Nombre
            </Text>
            <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
              {user?.name ?? '-'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-sm"
            >
              Email
            </Text>
            <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
              {user?.email ?? '-'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-sm"
            >
              Telefono
            </Text>
            <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
              {user?.phone ?? 'No registrado'}
            </Text>
          </View>
        </View>
      </View>

      {/* App info */}
      <View className="border-border bg-card mb-6 rounded-xl border p-4">
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-sm">
          Informacion de la App
        </Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-sm"
            >
              Version
            </Text>
            <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
              1.0.0
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground text-sm"
            >
              Plataforma
            </Text>
            <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
              EPDE Mobile
            </Text>
          </View>
        </View>
      </View>

      {/* Logout button */}
      <Pressable onPress={handleLogout} className="bg-destructive items-center rounded-xl py-3">
        <Text
          style={{ fontFamily: 'DMSans_700Bold' }}
          className="text-destructive-foreground text-base"
        >
          Cerrar Sesion
        </Text>
      </Pressable>
    </ScrollView>
  );
}
