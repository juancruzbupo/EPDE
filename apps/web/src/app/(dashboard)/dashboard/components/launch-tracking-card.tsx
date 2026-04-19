'use client';

import type { PlanLaunchTracking } from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { AlertTriangle, CheckCircle2, Rocket } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  summary: PlanLaunchTracking;
}

/**
 * Card de tracking del precio de lanzamiento del plan EPDE.
 * Responde "¿cuándo subo el precio?" con progreso hacia el target de 20
 * clientes y warning proactivo al llegar a 18 (faltan 2).
 */
export function LaunchTrackingCard({ summary }: Props) {
  const pctFill = summary.progressPct * 100;
  const totalTierClients = summary.tierMix.SMALL + summary.tierMix.MEDIUM + summary.tierMix.LARGE;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="text-primary h-4 w-4" />
            Plan EPDE — lanzamiento
          </CardTitle>
          <span className="text-muted-foreground text-xs tabular-nums">
            {summary.clientsOnboarded} / {summary.launchTarget}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="bg-muted relative h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${pctFill}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {summary.launchTarget - summary.clientsOnboarded > 0
              ? `Faltan ${summary.launchTarget - summary.clientsOnboarded} clientes para el target de lanzamiento.`
              : 'Target de lanzamiento alcanzado.'}
          </p>
        </div>

        {/* Warning states */}
        {summary.targetReached && (
          <div className="border-success/30 bg-success/5 flex items-start gap-2 rounded-lg border p-3">
            <CheckCircle2 className="text-success mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-foreground text-xs leading-relaxed">
              <strong>Target alcanzado.</strong> Es momento de pasar al precio objetivo (+60%).
            </p>
          </div>
        )}
        {summary.priceIncreaseWarning && (
          <div className="border-warning/30 bg-warning/5 flex items-start gap-2 rounded-lg border p-3">
            <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-foreground text-xs leading-relaxed">
              <strong>Faltan pocos clientes.</strong> Preparate para comunicar la subida de precio
              al resto del canal.
            </p>
          </div>
        )}

        {/* Tier mix */}
        {totalTierClients > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">Mix por tier</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <p className="text-foreground font-bold tabular-nums">{summary.tierMix.SMALL}</p>
                <p className="text-muted-foreground">Chico</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-foreground font-bold tabular-nums">{summary.tierMix.MEDIUM}</p>
                <p className="text-muted-foreground">Estándar</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-foreground font-bold tabular-nums">{summary.tierMix.LARGE}</p>
                <p className="text-muted-foreground">Amplio</p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Facturado este mes</p>
              <p className="text-foreground text-lg font-bold tabular-nums">
                {formatARSCompact(summary.revenueThisMonth)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio promedio cobrado</p>
              <p className="text-foreground text-lg font-bold tabular-nums">
                {summary.avgEffectivePrice > 0 ? formatARSCompact(summary.avgEffectivePrice) : '—'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
