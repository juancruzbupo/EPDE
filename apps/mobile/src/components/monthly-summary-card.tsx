import React from 'react';
import { Text, View } from 'react-native';

import { useType } from '@/lib/fonts';

interface MonthlySummaryCardProps {
  completedThisMonth: number;
  isvDelta: number | null;
  healthScore: number;
  streak: number;
}

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Professional monthly progress card. Tone: management report, not game.
 * Shows only concrete data — completed tasks, ISV change, streak.
 * No emojis, no confetti, no "level up". The dopamine comes from seeing
 * that the property is maintained, not from celebration.
 */
export const MonthlySummaryCard = React.memo(function MonthlySummaryCard({
  completedThisMonth,
  isvDelta,
  healthScore,
  streak,
}: MonthlySummaryCardProps) {
  const TYPE = useType();
  const month = MONTH_NAMES[new Date().getMonth()];

  if (completedThisMonth === 0 && (isvDelta === null || isvDelta === 0) && streak === 0) {
    return null;
  }

  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.labelLg} className="text-muted-foreground mb-2 tracking-wider uppercase">
        Resumen de {month}
      </Text>

      <View className="gap-3">
        {completedThisMonth > 0 && (
          <View className="flex-row items-baseline justify-between">
            <Text style={TYPE.bodyMd} className="text-foreground">
              Tareas completadas
            </Text>
            <Text style={TYPE.titleMd} className="text-foreground">
              {completedThisMonth}
            </Text>
          </View>
        )}

        {isvDelta !== null && isvDelta !== 0 && (
          <View className="flex-row items-baseline justify-between">
            <Text style={TYPE.bodyMd} className="text-foreground">
              Índice de salud (ISV)
            </Text>
            <Text
              style={TYPE.titleMd}
              className={isvDelta > 0 ? 'text-success' : 'text-destructive'}
            >
              {healthScore}/100 ({isvDelta > 0 ? '+' : ''}
              {isvDelta})
            </Text>
          </View>
        )}

        {streak > 0 && (
          <View className="flex-row items-baseline justify-between">
            <Text style={TYPE.bodyMd} className="text-foreground">
              Meses consecutivos al día
            </Text>
            <Text style={TYPE.titleMd} className="text-foreground">
              {streak}
            </Text>
          </View>
        )}
      </View>

      {completedThisMonth > 0 && (
        <Text style={TYPE.bodySm} className="text-muted-foreground mt-3">
          Cada tarea preventiva completada reduce el riesgo de reparaciones correctivas que cuestan
          entre 8x y 15x más.
        </Text>
      )}
    </View>
  );
});
