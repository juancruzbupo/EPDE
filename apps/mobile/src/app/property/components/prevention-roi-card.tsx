import { formatARS } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { useType } from '@/lib/fonts';

interface PreventionROICardProps {
  totalSpent: number;
}

/**
 * Professional ROI summary for Gen X / Boomers who want to see that
 * their preventive maintenance investment has financial return. Uses
 * the real `expenses.totalCost` from the property — no fabricated
 * numbers.
 *
 * The 8x-15x multiplier comes from industry data (also cited in
 * PREVENTION_SAVINGS and in the budget-approval message). It's the
 * ratio between preventive maintenance cost and corrective repair
 * cost for the same failure.
 *
 * Only renders when `totalSpent > 0` — if the user hasn't paid for
 * any maintenance yet, showing $0 invested is demotivating, not
 * reassuring.
 */
export const PreventionROICard = React.memo(function PreventionROICard({
  totalSpent,
}: PreventionROICardProps) {
  const TYPE = useType();

  if (totalSpent <= 0) return null;

  const minSaved = totalSpent * 8;
  const maxSaved = totalSpent * 15;

  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.labelLg} className="text-muted-foreground mb-2 tracking-wider uppercase">
        Retorno de prevención
      </Text>

      <View className="flex-row items-baseline justify-between">
        <Text style={TYPE.bodyMd} className="text-foreground">
          Invertido en mantenimiento
        </Text>
        <Text style={TYPE.titleMd} className="text-foreground">
          {formatARS(totalSpent)}
        </Text>
      </View>

      <View className="bg-muted my-2 h-px" />

      <View className="flex-row items-baseline justify-between">
        <Text style={TYPE.bodyMd} className="text-foreground">
          Reparaciones evitadas (est.)
        </Text>
        <Text style={TYPE.titleMd} className="text-success">
          {formatARS(minSaved)} – {formatARS(maxSaved)}
        </Text>
      </View>

      <Text style={TYPE.bodySm} className="text-muted-foreground mt-3">
        Las reparaciones correctivas de los mismos rubros cuestan entre 8x y 15x más que el
        mantenimiento preventivo.
      </Text>
    </View>
  );
});
