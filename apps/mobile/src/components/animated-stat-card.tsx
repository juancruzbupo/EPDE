import { memo } from 'react';
import { Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { TYPE } from '@/lib/fonts';
import { useAnimatedEntry } from '@/lib/animations';
import { AnimatedNumber } from './animated-number';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  variant?: 'default' | 'destructive';
  index?: number;
}

export const AnimatedStatCard = memo(function AnimatedStatCard({
  title,
  value,
  variant = 'default',
  index = 0,
}: AnimatedStatCardProps) {
  const entryStyle = useAnimatedEntry(index * 60);

  return (
    <Animated.View
      style={entryStyle}
      className="border-border bg-card flex-1 rounded-xl border p-3"
    >
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {title}
      </Text>
      <AnimatedNumber
        value={value}
        style={TYPE.numberLg}
        className={`mt-1 ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}
      />
    </Animated.View>
  );
});
