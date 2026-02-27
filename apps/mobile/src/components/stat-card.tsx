import { memo } from 'react';
import { View, Text } from 'react-native';
import { fonts } from '@/lib/fonts';

interface StatCardProps {
  title: string;
  value: number;
  variant?: 'default' | 'destructive';
}

export const StatCard = memo(function StatCard({
  title,
  value,
  variant = 'default',
}: StatCardProps) {
  return (
    <View className="border-border bg-card flex-1 rounded-xl border p-3">
      <Text style={fonts.regular} className="text-muted-foreground text-xs">
        {title}
      </Text>
      <Text
        style={fonts.bold}
        className={`mt-1 text-2xl ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  );
});
