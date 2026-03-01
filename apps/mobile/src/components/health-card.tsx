import { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TYPE } from '@/lib/fonts';
import { TIMING, useReducedMotion } from '@/lib/animations';
import { AnimatedNumber } from './animated-number';

interface HealthCardProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

function getHealthInfo(total: number, overdue: number) {
  if (total === 0) return { percent: 100, label: 'Sin tareas', color: '#4a4542' };
  const percent = Math.round(((total - overdue) / total) * 100);
  if (percent > 90) return { percent, label: 'Excelente', color: '#6b9b7a' };
  if (percent > 70) return { percent, label: 'Bueno', color: '#c4704b' };
  if (percent > 50) return { percent, label: 'Necesita atencion', color: '#d4a843' };
  return { percent, label: 'Critico', color: '#c45b4b' };
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
              style={[TYPE.titleSm, { color: overdueTasks > 0 ? '#c45b4b' : undefined }]}
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
