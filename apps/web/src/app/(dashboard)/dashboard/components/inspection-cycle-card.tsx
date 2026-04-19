'use client';

import type { TechnicalInspectionCycleMetrics } from '@epde/shared';
import { ArrowRight, Clock, Timer } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  metrics: TechnicalInspectionCycleMetrics;
}

/**
 * Ciclo operativo de inspecciones técnicas: tiempo por tramo del state
 * machine. Permite detectar cuellos de botella (ej. agendamiento lento,
 * cobranza demorada) comparando tramos entre sí.
 */
export function InspectionCycleCard({ metrics }: Props) {
  const format = (days: number | null) =>
    days === null ? '—' : days < 1 ? `${(days * 24).toFixed(0)}h` : `${days.toFixed(1)}d`;

  const hasData = metrics.sampleSize > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="text-primary h-4 w-4" />
            Ciclo operativo — Inspecciones técnicas
          </CardTitle>
          {hasData && (
            <span className="text-muted-foreground text-xs tabular-nums">
              muestra: {metrics.sampleSize}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-muted-foreground py-4 text-center text-sm italic">
            Aún no hay inspecciones pagadas. Cuando completes tu primer ciclo, vas a ver tiempos
            reales acá.
          </p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-primary text-2xl font-bold tabular-nums">
                  {format(metrics.avgDaysRequestedToScheduled)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Agendar</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-primary text-2xl font-bold tabular-nums">
                  {format(metrics.avgDaysScheduledToReportReady)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Ejecutar + redactar</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-primary text-2xl font-bold tabular-nums">
                  {format(metrics.avgDaysReportReadyToPaid)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Cobrar</p>
              </div>
            </div>

            <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
              <span>Solicitud</span>
              <ArrowRight className="h-3 w-3" />
              <span>Visita</span>
              <ArrowRight className="h-3 w-3" />
              <span>Informe</span>
              <ArrowRight className="h-3 w-3" />
              <span>Pago</span>
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Ciclo completo promedio
                </span>
                <span className="text-foreground text-lg font-bold tabular-nums">
                  {format(metrics.avgDaysTotal)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
