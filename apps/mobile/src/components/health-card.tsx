import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TIMING, useReducedMotion } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

import { AnimatedNumber } from './animated-number';

interface HealthCardProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

function getHealthInfo(total: number, overdue: number) {
  if (total === 0) return { percent: 100, label: 'Sin tareas', color: COLORS.mutedForeground };
  const percent = Math.round(((total - overdue) / total) * 100);
  if (percent > 90) return { percent, label: 'Excelente', color: COLORS.success };
  if (percent > 70) return { percent, label: 'Bueno', color: COLORS.primary };
  if (percent > 50) return { percent, label: 'Necesita atención', color: COLORS.warning };
  return { percent, label: 'Crítico', color: COLORS.destructive };
}

export const HealthCard = memo(function HealthCard({
  totalTasks,
  completedTasks,
  overdueTasks,
}: HealthCardProps) {
  const reduced = useReducedMotion();
  const barWidth = useSharedValue(reduced ? 1 : 0);
  const { percent, label, color } = getHealthInfo(totalTasks, overdueTasks);

  useEffect(() => {
    barWidth.value = withTiming(percent / 100, {
      duration: reduced ? 0 : TIMING.slow * 2,
      easing: Easing.out(Easing.quad),
    });
  }, [percent, reduced, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    backgroundColor: color,
  }));

  return (
    <View className="border-border bg-card mb-3 rounded-xl border p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text style={TYPE.titleMd} className="text-foreground">
          Salud del Mantenimiento
        </Text>
        <Text style={[TYPE.labelMd, { color }]}>{label}</Text>
      </View>

      {/* Progress bar */}
      <View className="bg-muted mb-2 h-3 overflow-hidden rounded-full">
        <Animated.View style={[barStyle, { height: '100%', borderRadius: 9999 }]} />
      </View>

      <View className="flex-row items-center justify-between">
        <AnimatedNumber value={percent} suffix="%" style={[TYPE.numberLg, { color }]} />
        <View className="flex-row items-center gap-4">
          <View className="items-center">
            <Text style={TYPE.titleSm} className="text-foreground">
              {completedTasks}
            </Text>
            <Text style={TYPE.labelSm} className="text-muted-foreground">
              Completadas
            </Text>
          </View>
          <View className="items-center">
            <Text
              style={[TYPE.titleSm, { color: overdueTasks > 0 ? COLORS.destructive : undefined }]}
              className="text-foreground"
            >
              {overdueTasks}
            </Text>
            <Text style={TYPE.labelSm} className="text-muted-foreground">
              Vencidas
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
