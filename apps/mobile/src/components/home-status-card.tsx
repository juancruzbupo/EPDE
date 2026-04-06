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

interface MobileHomeStatusCardProps {
  score: number;
  label: string;
  overdueTasks: number;
  upcomingThisWeek: number;
  urgentTasks: number;
  pendingTasks: number;
  completedThisMonth: number;
  pendingBudgets: number;
  isvDelta?: number | null;
  streak?: number;
  perfectWeek?: boolean;
}

function getStatusTitle(score: number): string {
  if (score >= 80) return 'Tu casa está bien';
  if (score >= 60) return 'Tu casa necesita algo de atención';
  if (score >= 40) return 'Tu casa necesita atención';
  return 'Tu casa necesita atención urgente';
}

function getHumanMessage(score: number, overdue: number, upcoming: number): string {
  if (score >= 80) {
    return 'Todo bajo control. Seguí así y tu hogar se va a mantener en excelente estado.';
  }
  if (score >= 60) {
    if (overdue > 0) {
      return `Tenés ${overdue} tarea${overdue > 1 ? 's' : ''} vencida${overdue > 1 ? 's' : ''}. Revisalas para mantener tu casa al día.`;
    }
    return 'Hay algunas tareas pendientes. Un poco de atención ahora evita problemas mayores.';
  }
  if (score >= 40) {
    return `Hay varias tareas que necesitan atención${upcoming > 0 ? `, incluyendo ${upcoming} esta semana` : ''}. Te recomendamos revisarlas pronto.`;
  }
  return 'Tu hogar necesita atención urgente. Revisá las tareas pendientes lo antes posible para evitar problemas mayores.';
}

function getScoreConsequence(score: number): string | null {
  if (score >= 80) return null;
  if (score >= 60)
    return 'Mantené el ritmo de inspecciones para evitar que los costos de reparación aumenten.';
  if (score >= 40)
    return 'Un ISV por debajo de 60 indica que los problemas se están acumulando. Las reparaciones correctivas suelen costar entre 8x y 15x más que la prevención.';
  return 'Tu vivienda necesita intervención urgente. Cada mes de demora aumenta significativamente el costo de las reparaciones.';
}

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.warning;
  return COLORS.destructive;
}

function getContainerClasses(score: number): string {
  if (score >= 80) return 'border-success/20 bg-success/5';
  if (score >= 60) return 'border-primary/20 bg-primary/5';
  if (score >= 40) return 'border-warning/20 bg-warning/5';
  return 'border-destructive/20 bg-destructive/5';
}

interface MiniStatProps {
  label: string;
  value: number;
  color?: string;
  accessibilityHint?: string;
}

const MiniStat = memo(function MiniStat({ label, value, color, accessibilityHint }: MiniStatProps) {
  return (
    <View className="flex-1 items-center" accessibilityHint={accessibilityHint}>
      <Text style={[TYPE.numberMd, color ? { color } : undefined]} className="text-foreground">
        {value}
      </Text>
      <Text
        style={TYPE.labelSm}
        className="text-muted-foreground"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

export const HomeStatusCard = memo(function HomeStatusCard({
  score,
  label,
  overdueTasks,
  upcomingThisWeek,
  pendingTasks,
  completedThisMonth,
  pendingBudgets,
  isvDelta,
  streak,
  perfectWeek,
}: MobileHomeStatusCardProps) {
  const reduced = useReducedMotion();
  const barWidth = useSharedValue(reduced ? 1 : 0);
  const color = getScoreColor(score);

  useEffect(() => {
    barWidth.value = withTiming(score / 100, {
      duration: reduced ? 0 : TIMING.slow * 2,
      easing: Easing.out(Easing.quad),
    });
  }, [score, reduced, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    backgroundColor: color,
  }));

  return (
    <View className={`mb-4 rounded-xl border p-4 ${getContainerClasses(score)}`}>
      {/* Header: title + score */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text style={TYPE.titleLg} className="text-foreground">
            {getStatusTitle(score)}
          </Text>
        </View>
        <View
          className="items-center"
          accessibilityHint="Índice de Salud de tu Vivienda — 100 es excelente, 0 es crítico"
        >
          <AnimatedNumber value={score} suffix="/100" style={[TYPE.numberLg, { color }]} />
          <Text style={[TYPE.labelSm, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: score }}
        accessibilityLabel="Índice de Salud de la Vivienda"
        className="bg-muted mb-3 h-2 overflow-hidden rounded-full"
      >
        <Animated.View style={[barStyle, { height: '100%', borderRadius: 9999 }]} />
      </View>

      {/* ISV delta + streak badges */}
      {(isvDelta !== null && isvDelta !== undefined && isvDelta !== 0) ||
      (streak !== undefined && streak > 0) ? (
        <View className="mb-3 flex-row flex-wrap gap-2">
          {isvDelta !== null && isvDelta !== undefined && isvDelta !== 0 && (
            <View
              className={`flex-row items-center rounded-full px-2.5 py-1 ${isvDelta > 0 ? 'bg-success/10' : 'bg-destructive/10'}`}
            >
              <Text
                style={TYPE.labelSm}
                className={isvDelta > 0 ? 'text-success' : 'text-destructive'}
              >
                {isvDelta > 0 ? '↑' : '↓'} {Math.abs(isvDelta)} puntos este mes
              </Text>
            </View>
          )}
          {streak !== undefined && streak > 0 && (
            <View className="bg-primary/10 flex-row items-center rounded-full px-2.5 py-1">
              <Text style={TYPE.labelSm} className="text-primary">
                🔥 {streak} {streak === 1 ? 'mes' : 'meses'} al día
              </Text>
            </View>
          )}
          {perfectWeek && (
            <View className="bg-success/10 flex-row items-center rounded-full px-2.5 py-1">
              <Text style={TYPE.labelSm} className="text-success">
                ✓ Semana perfecta
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Human message */}
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
        {getHumanMessage(score, overdueTasks, upcomingThisWeek)}
      </Text>
      {getScoreConsequence(score) && (
        <Text style={TYPE.labelSm} className="text-muted-foreground mb-3">
          {getScoreConsequence(score)}
        </Text>
      )}

      {/* Mini stats row */}
      <View className="flex-row">
        <MiniStat
          label="Vencidas"
          value={overdueTasks}
          color={overdueTasks > 0 ? COLORS.destructive : undefined}
          accessibilityHint="Tareas que pasaron su fecha de vencimiento"
        />
        <MiniStat
          label="Pendientes"
          value={pendingTasks}
          accessibilityHint="Tareas programadas que aún no vencieron"
        />
        <MiniStat
          label="Completadas este mes"
          value={completedThisMonth}
          color={completedThisMonth > 0 ? COLORS.success : undefined}
          accessibilityHint="Tareas completadas en los últimos 30 días"
        />
        <MiniStat
          label="Presup. pendientes"
          value={pendingBudgets}
          accessibilityHint="Presupuestos pendientes de aprobación"
        />
      </View>
    </View>
  );
});
