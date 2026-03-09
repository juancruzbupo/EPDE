import { memo } from 'react';
import { Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

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
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {title}
      </Text>
      <Text
        style={TYPE.numberLg}
        className={`mt-1 ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  );
});
