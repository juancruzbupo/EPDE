'use client';

import { type BudgetPipeline, formatARSCompact } from '@epde/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_AXIS_TICK, CHART_AXIS_TICK_SM } from '@/lib/chart-styles';
import { useMotionPreference } from '@/lib/motion';

import { useChartColors } from './use-chart-colors';

interface BudgetPipelineChartProps {
  data: BudgetPipeline[];
}

const formatCurrency = (v: number) => formatARSCompact(v);

function BudgetPipelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: BudgetPipeline & { fill: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
      <p className="type-label-md text-foreground mb-1">{label}</p>
      <p className="type-body-sm">{item.count} presupuestos</p>
      <p className="type-body-sm text-muted-foreground">
        Total: {formatCurrency(item.totalAmount)}
      </p>
    </div>
  );
}

export function BudgetPipelineChart({ data }: BudgetPipelineChartProps) {
  const colors = useChartColors();
  const { shouldAnimate } = useMotionPreference();

  const statusColors: Record<string, string> = {
    PENDING: colors[3]!,
    QUOTED: colors[2]!,
    APPROVED: colors[1]!,
    REJECTED: 'var(--destructive)',
    IN_PROGRESS: colors[0]!,
    COMPLETED: colors[1]!,
  };

  const chartData = data.map((d) => ({
    ...d,
    fill: statusColors[d.status] ?? colors[0],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis dataKey="label" tick={CHART_AXIS_TICK_SM} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<BudgetPipelineTooltip />} />
        <Bar
          dataKey="count"
          name="Presupuestos"
          radius={[4, 4, 0, 0]}
          isAnimationActive={shouldAnimate}
          animationDuration={800}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
