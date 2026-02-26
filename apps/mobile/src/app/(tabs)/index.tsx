import { View, Text } from 'react-native';
import { UserRole, TaskStatus } from '@epde/shared';

export default function HomeScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center px-6">
      <Text
        style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
        className="text-primary mb-2 text-4xl"
      >
        EPDE
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mb-8 text-lg"
      >
        Mantenimiento Preventivo
      </Text>

      <View className="bg-card border-border w-full rounded-xl border p-6">
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-3 text-base">
          Verificación @epde/shared
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-muted-foreground mb-1 text-sm"
        >
          UserRole.CLIENT = {UserRole.CLIENT}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-muted-foreground mb-1 text-sm"
        >
          TaskStatus.PENDING = {TaskStatus.PENDING}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-success mt-2 text-sm">
          Imports funcionando correctamente
        </Text>
      </View>
    </View>
  );
}
