'use client';

import type { TimeSeriesPoint } from '@epde/shared';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useMotionPreference } from '@/lib/motion';

import { ChartTooltip } from './chart-tooltip';
import { useChartColors } from './use-chart-colors';

interface CostHistoryChartProps {
  data: TimeSeriesPoint[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

export function CostHistoryChart({ data }: CostHistoryChartProps) {
  const colors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  const avg = useMemo(() => {
    const nonZero = data.filter((d) => d.value > 0);
    if (nonZero.length === 0) return 0;
    return nonZero.reduce((acc, d) => acc + d.value, 0) / nonZero.length;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
        {avg > 0 && (
          <ReferenceLine
            y={avg}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        )}
        <Bar
          dataKey="value"
          name="Gastos"
          fill={colors[0]}
          radius={[4, 4, 0, 0]}
          isAnimationActive={shouldAnimate}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
