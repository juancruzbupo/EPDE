'use client';

import { type CategoryCostPoint, formatARSCompact } from '@epde/shared';
import { useMemo } from 'react';
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

interface CategoryCostsChartProps {
  data: CategoryCostPoint[];
}

const formatCurrency = (v: number) => formatARSCompact(v);

export function CategoryCostsChart({ data }: CategoryCostsChartProps) {
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
        row[cat] = point.categories[cat] ?? 0;
      }
      return row;
    });

    return { categories: cats, chartData: mapped };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          {categories.map((cat, i) => (
            <linearGradient key={cat} id={`costGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
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
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
        {categories.map((cat, i) => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            name={cat}
            stackId="1"
            stroke={colors[i % colors.length]}
            fill={`url(#costGrad-${i})`}
            strokeWidth={2}
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
