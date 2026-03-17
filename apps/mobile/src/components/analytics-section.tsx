import type { ClientAnalytics } from '@epde/shared';
import { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CategoryBreakdownList } from '@/components/charts/category-breakdown-list';
import { ChartCard } from '@/components/charts/chart-card';
import { MiniBarChart } from '@/components/charts/mini-bar-chart';
import { MiniDonutChart } from '@/components/charts/mini-donut-chart';
import { MiniTrendChart } from '@/components/charts/mini-trend-chart';
import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface AnalyticsSectionProps {
  analytics: ClientAnalytics | undefined;
  isLoading: boolean;
  chartMonths: number;
  onMonthsChange: (months: number) => void;
}

const CHART_MONTH_OPTIONS = [
  { value: 3, label: '3m' },
  { value: 6, label: '6m' },
  { value: 12, label: '12m' },
] as const;

export const AnalyticsSection = memo(function AnalyticsSection({
  analytics,
  isLoading,
  chartMonths,
  onMonthsChange,
}: AnalyticsSectionProps) {
  const conditionTrendData = useMemo(() => {
    const trend = analytics?.conditionTrend ?? [];
    if (trend.length === 0) return [];

    return trend.map((point) => {
      const values = Object.values(point.categories);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { label: point.label, value: Math.round(avg * 10) / 10 };
    });
  }, [analytics?.conditionTrend]);

  const costHistoryData = useMemo(() => {
    return (analytics?.costHistory ?? []).map((p) => ({
      label: p.label,
      value: p.value,
    }));
  }, [analytics?.costHistory]);

  const handleMonthChange = (months: number) => {
    haptics.light();
    onMonthsChange(months);
  };

  return (
    <CollapsibleSection title="Ver analisis completo" defaultOpen={false}>
      {/* Month selector pills */}
      <View className="mb-3 flex-row items-center justify-end gap-1">
        {CHART_MONTH_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => handleMonthChange(opt.value)}
            className={`rounded-full px-3 py-1 ${
              chartMonths === opt.value ? 'bg-primary' : 'bg-card border-border border'
            }`}
          >
            <Text
              style={TYPE.labelMd}
              className={chartMonths === opt.value ? 'text-primary-foreground' : 'text-foreground'}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Charts */}
      <ChartCard
        title="Condicion General"
        description="Distribucion del estado de tus tareas"
        isLoading={isLoading && !analytics}
        isEmpty={(analytics?.conditionDistribution ?? []).length === 0}
        emptyMessage="Sin datos de condicion"
      >
        <MiniDonutChart data={analytics?.conditionDistribution ?? []} />
      </ChartCard>

      <ChartCard
        title="Evolucion de Condicion"
        description="Promedio mensual de todas las categorias"
        isLoading={isLoading && !analytics}
        isEmpty={conditionTrendData.length === 0}
        emptyMessage="Sin historial de condicion"
      >
        <MiniTrendChart data={conditionTrendData} />
      </ChartCard>

      <ChartCard
        title="Gastos del Ultimo Ano"
        description="Costos de mantenimiento por mes"
        isLoading={isLoading && !analytics}
        isEmpty={costHistoryData.length === 0}
        emptyMessage="Sin gastos registrados"
      >
        <MiniBarChart data={costHistoryData} />
      </ChartCard>

      <ChartCard
        title="Estado por Categoria"
        description="Progreso y condicion por area"
        isLoading={isLoading && !analytics}
        isEmpty={(analytics?.categoryBreakdown ?? []).length === 0}
        emptyMessage="Sin categorias registradas"
      >
        <CategoryBreakdownList data={analytics?.categoryBreakdown ?? []} />
      </ChartCard>
    </CollapsibleSection>
  );
});
