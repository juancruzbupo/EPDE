import React from 'react';
import { Text, View } from 'react-native';

import { useType } from '@/lib/fonts';

interface ProtectedHomeBannerProps {
  overdueTasks: number;
  urgentTasks: number;
}

/**
 * Status banner when the property portfolio has zero overdue + zero urgent
 * tasks. The dopamine here is relief, not celebration — "your house is
 * OK, you can relax". Professional tone: operational status, like a
 * building management system reporting all-clear.
 *
 * Hidden when there ARE overdue or urgent tasks (those get their own
 * attention via the ActionList + ISV score coloring).
 */
export const ProtectedHomeBanner = React.memo(function ProtectedHomeBanner({
  overdueTasks,
  urgentTasks,
}: ProtectedHomeBannerProps) {
  const TYPE = useType();

  if (overdueTasks > 0 || urgentTasks > 0) return null;

  return (
    <View className="border-success/30 bg-success/5 mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-success mb-1">
        Tu vivienda está al día
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        No tenés tareas vencidas ni urgentes. El mantenimiento preventivo está funcionando.
      </Text>
    </View>
  );
});
