import { CHART_TOKENS_LIGHT } from '@epde/shared';

export const CHART_COLORS = [
  CHART_TOKENS_LIGHT.chart1,
  CHART_TOKENS_LIGHT.chart2,
  CHART_TOKENS_LIGHT.chart3,
  CHART_TOKENS_LIGHT.chart4,
  CHART_TOKENS_LIGHT.chart5,
] as const;

export const CONDITION_COLORS: Record<string, string> = {
  EXCELLENT: CHART_TOKENS_LIGHT.chart2,
  GOOD: CHART_TOKENS_LIGHT.chart3,
  FAIR: CHART_TOKENS_LIGHT.chart4,
  POOR: CHART_TOKENS_LIGHT.chart5,
  CRITICAL: '#c45b4b',
};

export const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  FAIR: 'Regular',
  POOR: 'Pobre',
  CRITICAL: 'Critico',
};
