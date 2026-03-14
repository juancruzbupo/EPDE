'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useMotionPreference } from '@/lib/motion';

import { ChartTooltip } from './chart-tooltip';
import { useChartColors } from './use-chart-colors';

interface ConditionTrendChartProps {
  data: Array<{
    month: string;
    label: string;
    categories: Record<string, number>;
  }>;
}

const CONDITION_LABELS = ['', 'Crítico', 'Pobre', 'Regular', 'Bueno', 'Excelente'];

export function ConditionTrendChart({ data }: ConditionTrendChartProps) {
  const colors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  const { categories, chartData } = useMemo(() => {
    const catSet = new Set<string>();
    for (const point of data) {
      for (const cat of Object.keys(point.categories)) {
        catSet.add(cat);
      }
    }
    const cats = [...catSet].slice(0, 5);

    const mapped = data.map((point) => {
      const row: Record<string, string | number> = { label: point.label };
      for (const cat of cats) {
        if (point.categories[cat] !== undefined) {
          row[cat] = point.categories[cat];
        }
      }
      return row;
    });

    return { categories: cats, chartData: mapped };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => CONDITION_LABELS[v] ?? ''}
          width={70}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(v: number) => CONDITION_LABELS[Math.round(v)] ?? String(v)} />
          }
        />
        {categories.map((cat, i) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            name={cat}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
