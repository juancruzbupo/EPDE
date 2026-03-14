'use client';

import type { ConditionDistribution } from '@epde/shared';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useMotionPreference } from '@/lib/motion';

import { ChartTooltip } from './chart-tooltip';
import { useChartColors } from './use-chart-colors';

interface ConditionDonutChartProps {
  data: ConditionDistribution[];
}

const CONDITION_ORDER = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];

export function ConditionDonutChart({ data }: ConditionDonutChartProps) {
  const chartColors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  const colorMap: Record<string, string> = {
    EXCELLENT: chartColors[1]!,
    GOOD: chartColors[2]!,
    FAIR: chartColors[3]!,
    POOR: chartColors[4]!,
    CRITICAL: 'var(--destructive)',
  };

  const sorted = [...data].sort(
    (a, b) => CONDITION_ORDER.indexOf(a.condition) - CONDITION_ORDER.indexOf(b.condition),
  );

  const total = data.reduce((acc, d) => acc + d.count, 0);
  const okCount = data
    .filter((d) => d.condition === 'EXCELLENT' || d.condition === 'GOOD')
    .reduce((acc, d) => acc + d.count, 0);
  const okPercent = total > 0 ? Math.round((okCount / total) * 100) : 0;

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={sorted}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              dataKey="count"
              nameKey="label"
              paddingAngle={2}
              isAnimationActive={shouldAnimate}
              animationDuration={800}
            >
              {sorted.map((entry) => (
                <Cell key={entry.condition} fill={colorMap[entry.condition] ?? '#888'} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="type-number-lg text-foreground">{okPercent}%</span>
            <span className="type-label-sm text-muted-foreground block">OK</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {sorted.map((entry) => (
          <div key={entry.condition} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorMap[entry.condition] }}
            />
            <span className="type-label-sm text-muted-foreground">
              {entry.label} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
