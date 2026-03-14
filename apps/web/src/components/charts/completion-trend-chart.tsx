'use client';

import type { TimeSeriesPoint } from '@epde/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useMotionPreference } from '@/lib/motion';

import { ChartTooltip } from './chart-tooltip';
import { useChartColors } from './use-chart-colors';

interface CompletionTrendChartProps {
  data: TimeSeriesPoint[];
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const colors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          name="Completadas"
          stroke={colors[0]}
          fill="url(#colorTrend)"
          strokeWidth={2}
          dot={{ r: 4, fill: colors[0] }}
          activeDot={{ r: 6 }}
          isAnimationActive={shouldAnimate}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
