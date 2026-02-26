import { View, Text } from 'react-native';

export default function BudgetsScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center px-6">
      <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-xl">
        Presupuestos
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground text-center"
      >
        Proximamente: gestion de presupuestos
      </Text>
    </View>
  );
}
