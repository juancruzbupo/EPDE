'use client';

import type { PortfolioIsvSummary } from '@epde/shared';
import { Activity, Award, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  summary: PortfolioIsvSummary;
}

/**
 * ISV agregado del portfolio. Distribución de propiedades en buckets
 * (crítico/aviso/aceptable/bueno) + trend mensual del promedio.
 * Responde "¿EPDE está cuidando bien el stock de viviendas?".
 */
export function PortfolioIsvCard({ summary }: Props) {
  const hasData = summary.propertiesWithIsv > 0;
  const total = summary.propertiesWithIsv || 1;

  const buckets = [
    {
      key: 'good',
      label: 'Bueno (80+)',
      value: summary.distribution.good,
      color: 'bg-success',
    },
    {
      key: 'fair',
      label: 'Aceptable (60-79)',
      value: summary.distribution.fair,
      color: 'bg-primary',
    },
    {
      key: 'warning',
      label: 'Aviso (40-59)',
      value: summary.distribution.warning,
      color: 'bg-warning',
    },
    {
      key: 'critical',
      label: 'Crítico (<40)',
      value: summary.distribution.critical,
      color: 'bg-destructive',
    },
  ];

  const trendDelta =
    summary.trend.length >= 2
      ? (summary.trend[summary.trend.length - 1]?.avgScore ?? 0) - (summary.trend[0]?.avgScore ?? 0)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="text-primary h-4 w-4" />
            ISV del portfolio
          </CardTitle>
          {hasData && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {summary.propertiesWithIsv} propiedades
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="text-muted-foreground py-4 text-center text-sm italic">
            Todavía no hay propiedades con puntaje ISV calculado.
          </p>
        ) : (
          <>
            {/* ISV promedio */}
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">Promedio del portfolio</p>
                <p className="text-foreground text-3xl font-bold tabular-nums">
                  {summary.avgScore}
                  <span className="text-muted-foreground text-base font-normal"> / 100</span>
                </p>
              </div>
              {trendDelta !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    trendDelta > 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${trendDelta < 0 ? 'rotate-180' : ''}`} />
                  <span>
                    {trendDelta > 0 ? '+' : ''}
                    {trendDelta.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Distribución stacked bar */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Distribución</p>
              <div className="bg-muted flex h-3 overflow-hidden rounded-full">
                {buckets.map((b) =>
                  b.value > 0 ? (
                    <div
                      key={b.key}
                      className={b.color}
                      style={{ width: `${(b.value / total) * 100}%` }}
                      title={`${b.label}: ${b.value}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                {buckets.map((b) => (
                  <div key={b.key} className="text-muted-foreground flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${b.color}`} />
                    <span>
                      {b.label} — <strong className="text-foreground">{b.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificados elegibles */}
            {summary.certificateEligible > 0 && (
              <div className="border-success/30 bg-success/5 flex items-start gap-2 rounded-lg border p-3">
                <Award className="text-success mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-foreground text-xs leading-relaxed">
                  <strong>{summary.certificateEligible}</strong> propiedades son elegibles para el
                  Certificado de Mantenimiento (ISV ≥ 60 + plan de más de 1 año).
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
