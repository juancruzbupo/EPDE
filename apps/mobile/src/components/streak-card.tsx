import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/lib/animations';
import { TYPE } from '@/lib/fonts';

interface StreakCardProps {
  streak: number;
  perfectWeek: boolean;
}

export const StreakCard = memo(function StreakCard({ streak, perfectWeek }: StreakCardProps) {
  const reduced = useReducedMotion();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (reduced || streak === 0) return;
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1, { duration: 600 })),
      3,
      false,
    );
  }, [streak, reduced, pulseScale]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (streak === 0 && !perfectWeek) {
    return (
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <Text style={TYPE.bodySm} className="text-muted-foreground text-center">
          Completá todas las tareas de este mes para empezar tu racha 🔥
        </Text>
      </View>
    );
  }

  return (
    <View className="border-primary/15 bg-primary/[0.03] mb-4 flex-row items-center gap-4 rounded-xl border p-4">
      {/* Fire icon */}
      {streak > 0 && <Animated.Text style={[{ fontSize: 32 }, fireStyle]}>🔥</Animated.Text>}

      {/* Content */}
      <View className="flex-1">
        {streak > 0 && (
          <View className="flex-row items-baseline gap-1.5">
            <Text style={TYPE.numberLg} className="text-primary">
              {streak}
            </Text>
            <Text style={TYPE.titleSm} className="text-foreground">
              {streak === 1 ? 'mes al día' : 'meses al día'}
            </Text>
          </View>
        )}
        {streak > 0 && (
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Sin tareas vencidas. Seguí así.
          </Text>
        )}
        {perfectWeek && (
          <View className="mt-1 flex-row items-center gap-1.5">
            <Text style={{ fontSize: 16 }}>✅</Text>
            <Text style={TYPE.labelMd} className="text-success">
              Semana perfecta — completaste todo
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});
