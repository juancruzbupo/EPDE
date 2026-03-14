'use client';

import type { CategoryIssue } from '@epde/shared';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMotionPreference } from '@/lib/motion';

import { ChartTooltip } from './chart-tooltip';
import { useChartColors } from './use-chart-colors';

interface ProblematicCategoriesChartProps {
  data: CategoryIssue[];
}

export function ProblematicCategoriesChart({ data }: ProblematicCategoriesChartProps) {
  const colors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.5}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          dataKey="categoryName"
          type="category"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey="issueCount"
          name="Problemas"
          fill={colors[0]}
          radius={[0, 4, 4, 0]}
          isAnimationActive={shouldAnimate}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
