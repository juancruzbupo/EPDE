'use client';

import type { RevenueConsolidated } from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  summary: RevenueConsolidated;
}

/**
 * Card de facturación consolidada mensual. Responde "¿cuánta plata entró
 * este mes?" con comparación vs mes anterior y breakdown por fuente.
 */
export function RevenueConsolidatedCard({ summary }: Props) {
  const deltaPositive = summary.deltaAbsolute >= 0;
  const DeltaIcon = deltaPositive ? TrendingUp : TrendingDown;
  const deltaColor = deltaPositive ? 'text-success' : 'text-destructive';

  const total = summary.bySource.plan + summary.bySource.technicalInspections;
  const planPct = total > 0 ? (summary.bySource.plan / total) * 100 : 0;
  const inspPct = total > 0 ? (summary.bySource.technicalInspections / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="text-primary h-4 w-4" />
          Facturación consolidada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">Este mes</p>
            <p className="text-foreground text-3xl font-bold tabular-nums">
              {formatARSCompact(summary.thisMonth)}
            </p>
          </div>
          {summary.lastMonth > 0 && (
            <div className={`flex items-center gap-1 text-sm font-medium ${deltaColor}`}>
              <DeltaIcon className="h-4 w-4" />
              <span>
                {deltaPositive ? '+' : ''}
                {summary.deltaPct.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        <div className="text-muted-foreground flex justify-between text-xs">
          <span>Mes anterior: {formatARSCompact(summary.lastMonth)}</span>
          <span>YTD: {formatARSCompact(summary.ytd)}</span>
        </div>

        {total > 0 && (
          <div className="space-y-2 pt-3">
            <p className="text-muted-foreground text-xs font-medium">Por fuente este mes</p>
            <div className="bg-muted relative flex h-2 overflow-hidden rounded-full">
              <div className="bg-primary h-full" style={{ width: `${planPct}%` }} />
              <div className="bg-accent h-full" style={{ width: `${inspPct}%` }} />
            </div>
            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="bg-primary mr-1.5 inline-block h-2 w-2 rounded-full" />
                Plan EPDE — {formatARSCompact(summary.bySource.plan)}
              </div>
              <div>
                <span className="bg-accent mr-1.5 inline-block h-2 w-2 rounded-full" />
                Inspecciones — {formatARSCompact(summary.bySource.technicalInspections)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
