import { memo, useEffect } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
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
  onFreeze?: () => void;
  freezePending?: boolean;
}

export const StreakCard = memo(function StreakCard({
  streak,
  perfectWeek,
  onFreeze,
  freezePending,
}: StreakCardProps) {
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
          <View className="flex-row items-center gap-3">
            <Text style={TYPE.bodySm} className="text-muted-foreground flex-1">
              Sin tareas vencidas. Seguí así.
            </Text>
            {onFreeze && (
              <Pressable
                hitSlop={8}
                style={{ minHeight: 32 }}
                className="bg-muted rounded-full px-3 py-1.5"
                accessibilityRole="button"
                accessibilityLabel="Proteger racha — si no podés completar tareas este mes, tu racha no se rompe"
                accessibilityHint="Se puede usar 1 vez por mes"
                disabled={freezePending}
                onPress={onFreeze}
              >
                <Text style={TYPE.labelSm} className="text-muted-foreground">
                  ❄️ Proteger racha
                </Text>
              </Pressable>
            )}
            <Pressable
              hitSlop={8}
              style={{ minHeight: 32 }}
              className="bg-primary/10 rounded-full px-3 py-1.5"
              accessibilityRole="button"
              accessibilityLabel="Compartir racha por WhatsApp"
              onPress={() => {
                const msg = encodeURIComponent(
                  `🔥 Llevo ${streak} ${streak === 1 ? 'mes' : 'meses'} al día con el mantenimiento de mi casa usando EPDE. epde.com.ar`,
                );
                void Linking.openURL(`whatsapp://send?text=${msg}`);
              }}
            >
              <Text style={TYPE.labelSm} className="text-primary">
                WhatsApp
              </Text>
            </Pressable>
          </View>
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
