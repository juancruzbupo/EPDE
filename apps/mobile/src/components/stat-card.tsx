import { View, Text } from 'react-native';

interface StatCardProps {
  title: string;
  value: number;
  variant?: 'default' | 'destructive';
}

export function StatCard({ title, value, variant = 'default' }: StatCardProps) {
  return (
    <View className="border-border bg-card flex-1 rounded-xl border p-3">
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-xs">
        {title}
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_700Bold' }}
        className={`mt-1 text-2xl ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  );
}
